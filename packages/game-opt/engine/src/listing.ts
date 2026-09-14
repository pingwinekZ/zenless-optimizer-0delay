export const entryTypes = [
  'own',
  'enemy',
  'team',
  'target',
  'prevMember',
  'teamBuff',
  'notOwnBuff',
  'enemyDeBuff', // Ends with 'Buff' so `Calculator` can pick up on this tag
  'display', // Display-only, not participating in any buffs
] as const

/**
 * Per-hit calc namespaces: rotation hit `i` reads `preset${i}`. Sized for
 * the max combo length (see MAX_COMBO_HITS); only the presets actually used
 * by a team's frames produce entries.
 */
export const presets = Array.from(
  { length: 50 },
  (_, i) => `preset${i}`
) as unknown as readonly `preset${number}`[]

export type EntryType = (typeof entryTypes)[number]
export type Preset = (typeof presets)[number]
