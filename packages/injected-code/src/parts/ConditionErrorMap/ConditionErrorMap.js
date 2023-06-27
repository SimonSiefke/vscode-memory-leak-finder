import * as ConditionErrors from '../ConditionErrors/ConditionErrors.js'

export const getFunction = (fnName) => {
  switch (fnName) {
    case 'toBeVisible':
      return ConditionErrors.toBeVisible
    case 'toHaveValue':
      return ConditionErrors.toHaveValue
    case 'toHaveText':
      return ConditionErrors.toHaveText
    case 'toHaveAttribute':
      return ConditionErrors.toHaveAttribute
    case 'toHaveCount':
      return ConditionErrors.toHaveCount
    case 'toBeFocused':
      return ConditionErrors.toBeFocused
    case 'toHaveId':
      return ConditionErrors.toHaveId
    case 'toBeHidden':
      return ConditionErrors.toBeHidden
    case 'toHaveCss':
      return ConditionErrors.toHaveCss
    case 'toHaveClass':
      return ConditionErrors.toHaveClass
    default:
      throw new Error(`unexpected function name ${fnName}`)
  }
}
