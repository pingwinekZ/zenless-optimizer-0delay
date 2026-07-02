import react from '@vitejs/plugin-react'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { defineConfig, normalizePath, type Plugin } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import tsconfigPaths from 'vite-tsconfig-paths'
import pkg from './package.json' with { type: 'json' }

// Source directories for locale files (relative to Vite root = app/)
const localeDirs = [
  resolve('../packages/common/localization/assets/locales'),
  resolve('./src/localization/assets/locales'),
  resolve('./src/dm-localization/assets/locales'),
]

function serveLocaleFiles(): Plugin {
  const marker = '/assets/locales/'
  return {
    name: 'serve-locale-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        if (
          !url.includes(marker) &&
          !url.includes('/zenless-optimizer-0delay/assets/locales/')
        )
          return next()
        const localePart = url.includes('/zenless-optimizer-0delay/')
          ? url
              .split('/zenless-optimizer-0delay/assets/locales/')[1]
              ?.split('?')[0]
          : url.split('/assets/locales/')[1]?.split('?')[0]
        if (!localePart) return next()
        for (const dir of localeDirs) {
          const fp = resolve(dir, localePart)
          if (existsSync(fp)) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(readFileSync(fp, 'utf-8'))
            return
          }
        }
        next()
      })
    },
  }
}

export default defineConfig(() => {
  const copyTargets = [
    {
      src: normalizePath(
        resolve('../packages/common/localization/assets/locales')
      ),
      dest: 'assets',
    },
    {
      src: normalizePath(resolve('./src/localization/assets/locales')),
      dest: 'assets',
    },
    {
      src: normalizePath(resolve('./src/dm-localization/assets/locales')),
      dest: 'assets',
    },
  ]

  const assetsDir = resolve('./assets')
  if (existsSync(assetsDir) && readdirSync(assetsDir).length > 0) {
    copyTargets.push({
      src: normalizePath(resolve('./assets/*')),
      dest: 'assets',
    })
  }

  return {
    base: '/zenless-optimizer-0delay/',
    root: __dirname,
    cacheDir: '../node_modules/.vite/app',

    server: {
      port: 4200,
      host: 'localhost',
      fs: {
        allow: ['../..'],
      },
    },

    preview: {
      port: 4300,
      host: 'localhost',
    },

    plugins: [
      react(),
      tsconfigPaths({ loose: true }),
      serveLocaleFiles(),
      // Nx executor for vite does not support `assets` prop for copying files.
      // So we need to do it with this plugin. This works for both `build` and `serve`.
      viteStaticCopy({
        targets: copyTargets,
        // Force page to reload if we change any of the above files
        watch: {
          reloadPageOnChange: true,
        },
      }),
    ],

    define: {
      __VERSION__: `"${pkg.version}"`,
    },

    // Uncomment this if you are using workers.
    worker: {
      // https://vitejs.dev/guide/migration#worker-plugins-is-now-a-function
      plugins: () => [tsconfigPaths({ loose: true })],
    },

    build: {
      outDir: '../dist/app',
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react/')
            )
              return 'react-vendor'
            if (id.includes('node_modules/@mantine/')) return 'mantine'
            if (id.includes('node_modules/ag-grid')) return 'ag-grid'
            if (id.includes('node_modules/@tabler/icons-react'))
              return 'tabler-icons'
            if (
              id.includes('node_modules/i18next') ||
              id.includes('node_modules/react-i18next')
            )
              return 'i18n'
          },
        },
      },
    },
  }
})
