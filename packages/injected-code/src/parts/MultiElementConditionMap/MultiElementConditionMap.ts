import * as MultiElementConditions from '../MultiElementConditions/MultiElementConditions.ts'

export const getFunction = (fnName) => {
  switch (fnName) {
    case 'toBeHidden':
      return MultiElementConditions.toBeHidden
    case 'toHaveCount':
      return MultiElementConditions.toHaveCount
    default:
      throw new Error(`unexpected function name ${fnName}`)
  }
}
