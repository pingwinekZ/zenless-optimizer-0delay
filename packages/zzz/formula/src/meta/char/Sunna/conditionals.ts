// WARNING: Generated file, do not modify
export const conditionals = {
  abilityStun: { sheet: 'Sunna', name: 'abilityStun', type: 'bool' },
  angelic_chordination: {
    sheet: 'Sunna',
    name: 'angelic_chordination',
    type: 'bool',
  },
  etherVeil: {
    sheet: 'Sunna',
    name: 'etherVeil',
    type: 'bool',
    mindscapeRequirement: 2,
  },
  etherVeilReprise: { sheet: 'Sunna', name: 'etherVeilReprise', type: 'bool' },
  focusedCreation: {
    sheet: 'Sunna',
    name: 'focusedCreation',
    type: 'bool',
    mindscapeRequirement: 6,
  },
  focusedCreationDmg: {
    sheet: 'Sunna',
    name: 'focusedCreationDmg',
    type: 'bool',
    mindscapeRequirement: 6,
  },
  m1DefReductionStacks: {
    sheet: 'Sunna',
    name: 'm1DefReductionStacks',
    type: 'num',
    int_only: true,
    min: 0,
    max: 3,
    mindscapeRequirement: 1,
  },
  teammateSlot: {
    sheet: 'Sunna',
    name: 'teammateSlot',
    type: 'list',
    list: ['None', 'Slot 1', 'Slot 2'],
  },
  ult_used: {
    sheet: 'Sunna',
    name: 'ult_used',
    type: 'bool',
    mindscapeRequirement: 4,
  },
} as const
