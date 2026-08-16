import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../consts'

type CharacterPlan = {
  effectiveStats: DiscSubStatKey[]
  substatWeights: Partial<Record<DiscSubStatKey, number>>
  mainStats: Partial<Record<DiscSlotKey, DiscMainStatKey[]>>
}

/* ───────── Archetype templates ───────── */
// Each character explicitly maps to one of these. This keeps the data
// maintainable while still being per-character rather than per-specialty.

const DPS_EFFECTIVE: DiscSubStatKey[] = [
  'atk_',
  'crit_',
  'crit_dmg_',
  'atk',
  'pen',
]
const DPS_WEIGHTS: Partial<Record<DiscSubStatKey, number>> = {
  crit_: 1.5,
  crit_dmg_: 1.5,
  atk_: 1.2,
  pen: 1.2,
  atk: 1.0,
}
const DPS_MAIN: Partial<Record<DiscSlotKey, DiscMainStatKey[]>> = {
  4: ['crit_', 'crit_dmg_', 'atk_'],
  5: [
    'atk_',
    'pen_',
    'electric_dmg_',
    'fire_dmg_',
    'ice_dmg_',
    'physical_dmg_',
    'ether_dmg_',
  ],
  6: ['atk_', 'enerRegen_'],
}

const DPS: CharacterPlan = {
  effectiveStats: DPS_EFFECTIVE,
  substatWeights: DPS_WEIGHTS,
  mainStats: DPS_MAIN,
}

/* ─────── Per-character plans ─────── */

const characterPlans: Record<CharacterKey, CharacterPlan> = {
  // ═══ Attack characters ═══
  Anton: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['electric_dmg_'],
      6: ['atk_'],
    },
  },
  Billy: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['pen_', 'atk_', 'physical_dmg_'],
      6: ['atk_'],
    },
  },
  Cissia: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.5,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['electric_dmg_', 'atk_'],
      6: ['enerRegen_'],
    },
  },
  Corin: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_'],
      5: ['pen_', 'atk_', 'physical_dmg_'],
      6: ['atk_'],
    },
  },
  Ellen: {
    effectiveStats: ['crit_dmg_', 'crit_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_dmg_: 1.5,
      crit_: 1.4,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: { 4: ['crit_dmg_'], 5: ['pen_', 'ice_dmg_'], 6: ['atk_'] },
  },
  Evelyn: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.4,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_dmg_', 'crit_'],
      5: ['pen_', 'fire_dmg_'],
      6: ['atk_'],
    },
  },
  Harumasa: {
    effectiveStats: ['crit_', 'atk_', 'crit_dmg_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      atk_: 1.3,
      crit_dmg_: 1.1,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['atk_', 'crit_dmg_', 'crit_'],
      5: ['atk_', 'electric_dmg_'],
      6: ['atk_'],
    },
  },
  Hugo: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'atk', 'pen'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.3,
      atk_: 1.1,
      atk: 0.9,
      pen: 0.7,
    },
    mainStats: {
      4: ['crit_dmg_', 'crit_'],
      5: ['ice_dmg_', 'atk_', 'pen_'],
      6: ['atk_'],
    },
  },
  Nekomata: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['pen_', 'physical_dmg_', 'atk_'],
      6: ['atk_'],
    },
  },
  OrphieMagus: {
    effectiveStats: ['crit_dmg_', 'crit_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_dmg_: 1.5,
      crit_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['crit_dmg_', 'crit_'],
      5: ['fire_dmg_', 'atk_'],
      6: ['enerRegen_', 'atk_'],
    },
  },
  Seed: {
    effectiveStats: ['crit_dmg_', 'crit_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_dmg_: 1.5,
      crit_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['crit_dmg_', 'crit_'],
      5: ['pen_', 'atk_', 'electric_dmg_'],
      6: ['atk_'],
    },
  },
  Soldier0Anby: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['electric_dmg_', 'atk_'],
      6: ['atk_'],
    },
  },
  Soldier11: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'anomProf', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.2,
      anomProf: 1.0,
      pen: 0.8,
      atk: 0.6,
    },
    mainStats: {
      4: ['crit_', 'atk_', 'crit_dmg_'],
      5: ['pen_', 'atk_', 'fire_dmg_'],
      6: ['atk_'],
    },
  },
  YeShunguang: {
    effectiveStats: ['crit_dmg_', 'crit_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_dmg_: 1.5,
      crit_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: { 4: ['atk_', 'crit_dmg_'], 5: ['pen_', 'atk_'], 6: ['atk_'] },
  },
  ZhuYuan: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.5,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['crit_dmg_', 'crit_'],
      5: ['atk_', 'ether_dmg_', 'pen_'],
      6: ['atk_'],
    },
  },

  // ═══ Anomaly characters ═══
  Alice: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: {
      anomProf: 1.5,
      atk_: 1.2,
      pen: 1.2,
      atk: 1.0,
    },
    mainStats: {
      4: ['anomProf', 'atk_'],
      5: ['pen_', 'physical_dmg_', 'atk_'],
      6: ['anomMas_'],
    },
  },
  Aria: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: {
      anomProf: 1.5,
      atk_: 1.2,
      pen: 1.2,
      atk: 1.0,
    },
    mainStats: {
      4: ['anomProf'],
      5: ['ether_dmg_', 'atk_', 'pen_'],
      6: ['anomMas_'],
    },
  },
  Burnice: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: { anomProf: 1.5, atk_: 1.2, pen: 1.2, atk: 1.0 },
    mainStats: { 4: ['anomProf'], 5: ['pen_', 'fire_dmg_'], 6: ['anomMas_'] },
  },
  Grace: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: { anomProf: 1.5, atk_: 1.2, pen: 1.0, atk: 0.8 },
    mainStats: {
      4: ['anomProf', 'atk_'],
      5: ['pen_', 'electric_dmg_', 'atk_'],
      6: ['anomMas_'],
    },
  },
  Jane: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: { anomProf: 1.5, atk_: 1.2, pen: 1.0, atk: 1.0 },
    mainStats: {
      4: ['anomProf'],
      5: ['pen_', 'physical_dmg_', 'atk_'],
      6: ['anomMas_'],
    },
  },
  Piper: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: { anomProf: 1.5, atk_: 1.2, pen: 1.0, atk: 1.0 },
    mainStats: {
      4: ['anomProf'],
      5: ['pen_', 'atk_', 'physical_dmg_'],
      6: ['anomMas_'],
    },
  },
  Promeia: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: { anomProf: 1.5, atk_: 1.2, pen: 1.0, atk: 0.8 },
    mainStats: {
      4: ['anomProf'],
      5: ['ice_dmg_', 'atk_', 'pen_'],
      6: ['anomMas_'],
    },
  },
  Vivian: {
    effectiveStats: ['anomProf', 'atk_', 'atk', 'pen'],
    substatWeights: { anomProf: 1.8, atk_: 1.2, atk: 1.0, pen: 1.0 },
    mainStats: {
      4: ['anomProf'],
      5: ['ether_dmg_', 'pen_', 'atk_'],
      6: ['anomMas_'],
    },
  },
  Yanagi: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: { anomProf: 1.5, atk_: 1.2, pen: 1.0, atk: 1.0 },
    mainStats: {
      4: ['anomProf'],
      5: ['pen_', 'electric_dmg_', 'atk_'],
      6: ['anomMas_', 'atk_'],
    },
  },

  Miyabi: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'anomProf', 'atk', 'pen'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.4,
      atk_: 1.4,
      anomProf: 1.0,
      atk: 1.0,
      pen: 1.0,
    },
    mainStats: {
      4: ['crit_', 'atk_'],
      5: ['ice_dmg_', 'atk_'],
      6: ['atk_'],
    },
  },

  // ═══ Stun characters ═══
  Anby: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['electric_dmg_', 'atk_'],
      6: ['impact_'],
    },
  },
  Dialyn: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.2,
      atk_: 1.2,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['crit_'],
      5: ['atk_', 'physical_dmg_', 'pen_'],
      6: ['enerRegen_'],
    },
  },
  JuFufu: {
    effectiveStats: ['crit_', 'atk_', 'atk', 'crit_dmg_', 'pen'],
    substatWeights: {
      crit_: 1.5,
      atk_: 1.2,
      atk: 1.2,
      crit_dmg_: 1.0,
      pen: 0.8,
    },
    mainStats: { 4: ['crit_', 'atk_'], 5: ['atk_'], 6: ['impact_', 'atk_'] },
  },
  Koleda: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.3,
      atk_: 1.1,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['fire_dmg_', 'atk_'],
      6: ['impact_'],
    },
  },
  Lighter: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.3,
      atk_: 1.1,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['atk_', 'fire_dmg_', 'pen_'],
      6: ['impact_'],
    },
  },
  Lycaon: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['ice_dmg_', 'atk_'],
      6: ['impact_'],
    },
  },
  NangongYu: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: { anomProf: 1.5, atk_: 1.2, pen: 1.0, atk: 0.8 },
    mainStats: {
      4: ['anomProf'],
      5: ['ether_dmg_', 'atk_', 'pen_'],
      6: ['anomMas_'],
    },
  },
  // Anomaly and CRIT builds share Disk 5/6 main stats;
  // Disk 4 merges both options; substats merge both priority lists
  Pulchra: {
    effectiveStats: ['crit_', 'crit_dmg_', 'anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      anomProf: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_', 'anomProf'],
      5: ['atk_', 'physical_dmg_'],
      6: ['impact_'],
    },
  },
  Qingyi: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.3,
      atk_: 1.1,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['electric_dmg_', 'atk_'],
      6: ['impact_'],
    },
  },
  Trigger: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.3,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: { 4: ['crit_'], 5: ['electric_dmg_', 'atk_'], 6: ['impact_'] },
  },

  // ═══ Support characters ═══
  // Both anomaly and CRIT builds share same main stats;
  // substats treat AP/Crit Rate/Crit DMG as same-weight tertiary priority
  AstraYao: {
    effectiveStats: ['atk_', 'atk', 'anomProf', 'crit_', 'crit_dmg_', 'pen'],
    substatWeights: {
      atk_: 1.5,
      atk: 1.2,
      anomProf: 1.0,
      crit_: 1.0,
      crit_dmg_: 1.0,
      pen: 0.8,
    },
    mainStats: {
      4: ['atk_'],
      5: ['atk_'],
      6: ['enerRegen_', 'atk_'],
    },
  },
  Lucia: {
    effectiveStats: ['hp_', 'hp', 'crit_', 'crit_dmg_'],
    substatWeights: { hp_: 1.5, hp: 1.2, crit_: 1.0, crit_dmg_: 0.9 },
    mainStats: { 4: ['hp_'], 5: ['hp_'], 6: ['hp_'] },
  },
  Lucy: {
    effectiveStats: ['atk_', 'crit_', 'crit_dmg_', 'pen', 'atk'],
    substatWeights: {
      atk_: 1.5,
      crit_: 1.5,
      crit_dmg_: 1.5,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['atk_', 'crit_'],
      5: ['atk_'],
      6: ['enerRegen_', 'atk_'],
    },
  },
  Nicole: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: { anomProf: 1.5, atk_: 1.5, pen: 1.0, atk: 1.0 },
    mainStats: {
      4: ['atk_', 'anomProf'],
      5: ['ether_dmg_', 'atk_'],
      6: ['enerRegen_', 'atk_'],
    },
  },
  Rina: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: { anomProf: 1.5, atk_: 1.2, pen: 1.0, atk: 1.0 },
    mainStats: {
      4: ['atk_', 'anomProf'],
      5: ['pen_'],
      6: ['enerRegen_', 'atk_'],
    },
  },
  Soukaku: {
    effectiveStats: ['atk_', 'crit_', 'crit_dmg_', 'pen', 'atk'],
    substatWeights: {
      atk_: 1.5,
      crit_: 1.5,
      crit_dmg_: 1.5,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['atk_', 'crit_'],
      5: ['atk_', 'ice_dmg_'],
      6: ['enerRegen_', 'atk_'],
    },
  },
  // Anomaly and CRIT builds share same main stats;
  // substats merge Anomaly Proficiency and CRIT stats at equal third-tier priority
  Sunna: {
    effectiveStats: ['atk_', 'atk', 'anomProf', 'crit_', 'crit_dmg_', 'pen'],
    substatWeights: {
      atk_: 1.5,
      atk: 1.2,
      anomProf: 1.0,
      crit_: 1.0,
      crit_dmg_: 1.0,
      pen: 0.8,
    },
    mainStats: {
      4: ['atk_'],
      5: ['atk_'],
      6: ['enerRegen_'],
    },
  },
  // Other Teams and Physical Teams builds share same main stats;
  // substats merge AP and CRIT priorities
  Yuzuha: {
    effectiveStats: ['atk_', 'atk', 'anomProf', 'crit_', 'crit_dmg_', 'pen'],
    substatWeights: {
      atk_: 1.5,
      atk: 1.2,
      anomProf: 1.0,
      crit_: 0.9,
      crit_dmg_: 0.9,
      pen: 0.7,
    },
    mainStats: {
      4: ['atk_', 'anomProf'],
      5: ['atk_', 'pen_'],
      6: ['anomMas_', 'atk_'],
    },
  },

  // ═══ Defense characters ═══
  Ben: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['fire_dmg_', 'pen_'],
      6: ['atk_'],
    },
  },
  PanYinhu: {
    effectiveStats: ['atk_', 'atk', 'crit_', 'crit_dmg_', 'pen'],
    substatWeights: {
      atk_: 1.5,
      atk: 1.5,
      crit_: 1.2,
      crit_dmg_: 1.2,
      pen: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_', 'atk_'],
      5: ['physical_dmg_', 'atk_'],
      6: ['atk_'],
    },
  },

  // Two builds share same main stats; substats merge CRIT and Anomaly priorities
  Caesar: {
    effectiveStats: ['crit_', 'crit_dmg_', 'anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      anomProf: 1.5,
      atk_: 1.2,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['crit_', 'anomProf'],
      5: ['physical_dmg_', 'atk_', 'pen_'],
      6: ['impact_'],
    },
  },

  Seth: {
    effectiveStats: ['atk_', 'anomProf', 'atk', 'pen'],
    substatWeights: { atk_: 1.5, anomProf: 1.2, atk: 1.0, pen: 0.8 },
    mainStats: {
      4: ['atk_', 'anomProf'],
      5: ['atk_', 'electric_dmg_'],
      6: ['enerRegen_', 'anomMas_'],
    },
  },
  Zhao: {
    effectiveStats: ['hp_', 'hp', 'crit_', 'crit_dmg_'],
    substatWeights: { hp_: 1.5, hp: 1.2, crit_: 1.0, crit_dmg_: 1.0 },
    mainStats: { 4: ['hp_'], 5: ['hp_'], 6: ['enerRegen_'] },
  },

  // ═══ Rupture characters ═══
  Banyue: {
    effectiveStats: ['crit_', 'crit_dmg_', 'hp_', 'atk_', 'hp'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      hp_: 1.2,
      atk_: 1.0,
      hp: 0.8,
    },
    mainStats: {
      4: ['crit_dmg_', 'crit_'],
      5: ['fire_dmg_', 'hp_'],
      6: ['hp_'],
    },
  },
  Manato: {
    effectiveStats: ['crit_', 'crit_dmg_', 'hp_', 'hp', 'atk_', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      hp_: 1.3,
      hp: 1.1,
      atk_: 0.9,
      atk: 0.7,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['fire_dmg_', 'hp_'],
      6: ['hp_'],
    },
  },
  StarlightBilly: {
    effectiveStats: ['crit_', 'crit_dmg_', 'hp_', 'hp', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.2,
      hp_: 1.2,
      hp: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_', 'hp_'],
      5: ['physical_dmg_', 'hp_'],
      6: ['hp_'],
    },
  },
  Yidhari: {
    effectiveStats: ['crit_', 'crit_dmg_', 'hp_', 'atk_', 'hp'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      hp_: 1.2,
      atk_: 1.0,
      hp: 1.0,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['ice_dmg_', 'hp_'],
      6: ['hp_'],
    },
  },
  Yixuan: {
    effectiveStats: ['crit_', 'crit_dmg_', 'hp_', 'atk_', 'hp'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.5,
      hp_: 1.2,
      atk_: 1.0,
      hp: 0.8,
    },
    mainStats: {
      4: ['crit_dmg_', 'crit_'],
      5: ['ether_dmg_', 'hp_'],
      6: ['hp_'],
    },
  },

  // ═══ New characters ═══
  Norma: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.3,
      atk_: 1.3,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['crit_'],
      5: ['fire_dmg_', 'pen_', 'atk_'],
      6: ['enerRegen_', 'impact_'],
    },
  },
  Pyrois: {
    effectiveStats: ['crit_', 'crit_dmg_', 'atk_', 'pen', 'atk'],
    substatWeights: {
      crit_: 1.5,
      crit_dmg_: 1.2,
      atk_: 1.2,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['crit_', 'crit_dmg_'],
      5: ['pen_', 'ether_dmg_', 'atk_'],
      6: ['atk_'],
    },
  },
  Velina: {
    effectiveStats: ['anomProf', 'atk_', 'pen', 'atk'],
    substatWeights: {
      anomProf: 1.5,
      atk_: 1.5,
      pen: 1.0,
      atk: 1.0,
    },
    mainStats: {
      4: ['anomProf'],
      5: ['wind_dmg_', 'atk_', 'pen_'],
      6: ['enerRegen_'],
    },
  },
  Remielle: {
    effectiveStats: ['atk_', 'anomProf', 'pen', 'atk'],
    substatWeights: {
      atk_: 1.5,
      anomProf: 1.2,
      pen: 1.0,
      atk: 0.8,
    },
    mainStats: {
      4: ['anomProf'],
      5: ['atk_'],
      6: ['atk_'],
    },
  },
  Sigrid: DPS,
}

/* ─────── Public getters ─────── */

export function getCharacterEffectiveStats(
  charKey: CharacterKey
): DiscSubStatKey[] {
  return characterPlans[charKey]?.effectiveStats ?? DPS.effectiveStats
}

export function getCharacterSubstatWeights(
  charKey: CharacterKey
): Partial<Record<DiscSubStatKey, number>> {
  return characterPlans[charKey]?.substatWeights ?? DPS.substatWeights
}

export function getCharacterEffectiveMainStats(
  charKey: CharacterKey
): Partial<Record<DiscSlotKey, DiscMainStatKey[]>> {
  return characterPlans[charKey]?.mainStats ?? DPS.mainStats
}

export function getAllCharacterEffectiveStats(): Record<
  CharacterKey,
  DiscSubStatKey[]
> {
  return Object.fromEntries(
    Object.keys(characterPlans).map((ck) => [
      ck as CharacterKey,
      getCharacterEffectiveStats(ck as CharacterKey),
    ])
  ) as Record<CharacterKey, DiscSubStatKey[]>
}

export function getAllCharacterEffectiveMainStats(): Record<
  CharacterKey,
  Partial<Record<DiscSlotKey, DiscMainStatKey[]>>
> {
  return Object.fromEntries(
    Object.keys(characterPlans).map((ck) => [
      ck as CharacterKey,
      getCharacterEffectiveMainStats(ck as CharacterKey),
    ])
  ) as Record<CharacterKey, Partial<Record<DiscSlotKey, DiscMainStatKey[]>>>
}

export function getAllCharacterSubstatWeights(): Record<
  CharacterKey,
  Partial<Record<DiscSubStatKey, number>>
> {
  return Object.fromEntries(
    Object.keys(characterPlans).map((ck) => [
      ck as CharacterKey,
      getCharacterSubstatWeights(ck as CharacterKey),
    ])
  ) as Record<CharacterKey, Partial<Record<DiscSubStatKey, number>>>
}
