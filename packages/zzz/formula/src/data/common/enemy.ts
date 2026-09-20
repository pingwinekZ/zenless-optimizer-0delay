import { allBoolConditionals, allListConditionals } from '../util'

export const { isStunned, isWindswept } = allBoolConditionals('enemy')

export const { windsweptInfusion } = allListConditionals('enemy', [
  'None',
  'fire',
  'electric',
  'ice',
  'physical',
  'ether',
])
