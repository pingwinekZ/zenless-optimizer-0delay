import { workspaceRoot } from '@nx/devkit'
import { spawn } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

const BIOME_CONFIG_PATH = join(workspaceRoot, 'biome.json')

/**
 * Maximum number of biome processes running at the same time. Pipelines can
 * queue thousands of files, spawning one process per file without a cap makes
 * Windows (and Bun) fail with `spawn UNKNOWN`.
 */
const MAX_CONCURRENT_FORMATTERS = 8
/** How many times a failed process spawn is retried before giving up */
const MAX_SPAWN_ATTEMPTS = 5

/** Thrown when biome could not be started at all (as opposed to failing) */
class FormatterSpawnError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FormatterSpawnError'
  }
}

/**
 * Resolve how to invoke biome. The platform specific native binary is preferred,
 * because going through the Node.js shim spawns an extra interpreter process for
 * every formatted file. `node` is not guaranteed to be on PATH either (only bun
 * might be available), so the shim is only a fallback.
 */
function resolveBiomeCommand(): { command: string; args: string[] } {
  const binName = process.platform === 'win32' ? 'biome.exe' : 'biome'
  const nativeCandidates = [
    join(
      workspaceRoot,
      'node_modules',
      '@biomejs',
      `cli-${process.platform}-${process.arch}`,
      binName
    ),
    join(
      workspaceRoot,
      'node_modules',
      '@biomejs',
      `cli-${process.platform}-${process.arch}-musl`,
      binName
    ),
  ]
  const nativeBin = nativeCandidates.find((candidate) => existsSync(candidate))
  if (nativeBin) return { command: nativeBin, args: [] }

  return {
    command: process.execPath,
    args: [
      join(workspaceRoot, 'node_modules', '@biomejs', 'biome', 'bin', 'biome'),
    ],
  }
}

let activeFormatters = 0
const waitingFormatters: (() => void)[] = []

function acquireFormatterSlot(): Promise<void> {
  if (activeFormatters < MAX_CONCURRENT_FORMATTERS) {
    activeFormatters++
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => waitingFormatters.push(resolve))
}

function releaseFormatterSlot() {
  const next = waitingFormatters.shift()
  if (next) next()
  else activeFormatters--
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function runFormatter(
  command: string,
  args: string[],
  input: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const spawnedProcess = spawn(command, args, { windowsHide: true })

    let data = ''
    let error = ''

    spawnedProcess.stdout.on('data', (chunk: Buffer) => {
      data += chunk.toString()
    })

    spawnedProcess.stderr.on('data', (err: Buffer) => {
      error += err.toString()
    })

    // Without this listener a failed spawn is emitted as an uncaught 'error'
    // event, which kills the whole pipeline instead of being retried.
    spawnedProcess.on('error', (err: NodeJS.ErrnoException) => {
      reject(
        new FormatterSpawnError(
          `Failed to spawn formatter (${err.code ?? 'unknown'}): ${err.message}`
        )
      )
    })

    spawnedProcess.on('close', (code: number | null) => {
      if (code === 0) resolve(data)
      else reject(new Error(`Process exited with code ${code}: ${error}`))
    })

    // The child can exit before reading stdin, which would emit an unhandled
    // EPIPE error on the stdin stream.
    spawnedProcess.stdin.on('error', () => {})
    spawnedProcess.stdin.write(input)
    spawnedProcess.stdin.end()
  })
}

/**
 * Formats text, returns formatted text. This function does not write directly to the provided file path.
 * File path is only used for determining type of parser
 * @param path Full path to file to get formatted, used for formatter to determine parser type
 * @param text Contents to be formatted
 */
export async function formatText(path: string, text: string): Promise<string> {
  // Use extension-based path to avoid triggering biome.json exclude patterns
  const ext = path.match(/\.(\w+)$/)?.[1] || 'json'
  const { command, args } = resolveBiomeCommand()
  const cliArgs = [
    ...args,
    'format',
    `--stdin-file-path=/tmp/opencode/tmp.${ext}`,
    `--config-path=${BIOME_CONFIG_PATH}`,
  ]

  for (let attempt = 1; ; attempt++) {
    await acquireFormatterSlot()
    try {
      return await runFormatter(command, cliArgs, text)
    } catch (err) {
      // Only transient spawn failures are retried, formatting errors are real
      if (
        !(err instanceof FormatterSpawnError) ||
        attempt >= MAX_SPAWN_ATTEMPTS
      )
        throw err
      await delay(50 * 2 ** (attempt - 1))
    } finally {
      releaseFormatterSlot()
    }
  }
}

export function dumpFile(filename: string, obj: unknown, print = false) {
  mkdirSync(dirname(filename), { recursive: true })
  const fileStr = JSON.stringify(obj, undefined, 2)
  writeFileSync(filename, fileStr)
  if (print) console.log('Generated JSON at', filename)
}
export async function dumpPrettyFile(filename: string, obj: unknown) {
  mkdirSync(dirname(filename), { recursive: true })
  const fileStr = await formatText(filename, JSON.stringify(obj))

  writeFileSync(filename, fileStr)
}

/**
 * Generate index file(index.ts) using a object as the directory structure, starting from a path.
 * @param obj That defines the structure, with leaves being strings for filenames.
 * @param path The starting path
 * @param ext The image file extension, defaults to 'png'
 * @returns
 */
export async function generateIndexFromObj(
  obj: object,
  path: string,
  ext = 'png'
) {
  const keys = Object.keys(obj).sort()
  if (!keys.length) return
  const isImg = typeof Object.values(obj)[0] === 'string'
  const entries = Object.entries(obj) as [string, unknown][]
  entries.sort(([a], [b]) => a.localeCompare(b))
  // generate a index.ts using keys
  const imports = entries
    .map(([k, v]) => `import ${k} from './${isImg ? `${v}.${ext}` : k}'`)
    .join('\n')
  const dataContent = entries.map(([k]) => `  ${k},`).join('\n')

  const indexContent = `
${imports}

const data = {
${dataContent}
} as const
export default data
`
  const formatted =
    '// This is a generated index file.\n\n' +
    (await formatText(`${path}/index.ts`, indexContent))
  mkdirSync(path, { recursive: true })
  writeFileSync(`${path}/index.ts`, formatted)

  await Promise.all(
    Object.entries(obj).map(async ([key, val]) => {
      if (typeof val === 'object')
        await generateIndexFromObj(val, `${path}/${key}`, ext)
    })
  )
}
