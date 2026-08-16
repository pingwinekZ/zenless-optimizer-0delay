import { z } from 'zod'
import { characterSchema, discSchema, wengineBaseSchema } from '../../schema'

const zoodMetadataSchema = z.object({
  format: z.literal('ZOOD'),
  version: z.number().int().min(1),
  source: z.string().optional(),
  exportDate: z.number().optional(),
})

export const zoodFormatSchema = z.object({
  ...zoodMetadataSchema.shape,
  wengines: z.array(wengineBaseSchema.extend({ id: z.string() })).optional(),
  // wengines are now catalog entries; exported data uses character-level wengineKey/wenginePhase
  characters: z.array(characterSchema).optional(),
  discs: z.array(discSchema.extend({ id: z.string() })).optional(),
})

export type ZOODFormat = z.infer<typeof zoodFormatSchema>

export function validateZOODImport(obj: unknown) {
  const result = zoodFormatSchema.safeParse(obj)
  if (result.success) {
    return { success: true as const, data: result.data }
  }
  return {
    success: false as const,
    errors: result.error.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  }
}
