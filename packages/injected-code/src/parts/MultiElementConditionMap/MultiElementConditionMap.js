import * as MultiElementConditions from '../MultiElementConditions/MultiElementConditions.js'

export const getFunction = (fnName) => {
  switch (fnName) {
    case 'toHaveCount':
      return MultiElementConditions.toHaveCount
    case 'toBeHidden':
      return MultiElementConditions.toBeHidden
    default:
      throw new Error(`unexpected function name ${fnName}`)
  }
}
