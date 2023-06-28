import * as SingleElementConditions from '../SingleElementCondition/SingleElementConditions.js'

export const getFunction = (fnName) => {
  switch (fnName) {
    case 'toBeVisible':
      return SingleElementConditions.toBeVisible
    case 'toHaveValue':
      return SingleElementConditions.toHaveValue
    case 'toHaveText':
      return SingleElementConditions.toHaveText
    case 'toHaveAttribute':
      return SingleElementConditions.toHaveAttribute
    case 'toBeFocused':
      return SingleElementConditions.toBeFocused
    case 'toHaveId':
      return SingleElementConditions.toHaveId
    case 'toHaveCss':
      return SingleElementConditions.toHaveCss
    case 'toHaveClass':
      return SingleElementConditions.toHaveClass
    case 'toBeHidden':
      return SingleElementConditions.toBeHidden
    default:
      throw new Error(`unexpected function name ${fnName}`)
  }
}
