import * as ConditionErrors from '../ConditionErrors/ConditionErrors.ts'

export const getFunction = (fnName) => {
  switch (fnName) {
    case 'toBeFocused':
      return ConditionErrors.toBeFocused
    case 'toBeHidden':
      return ConditionErrors.toBeHidden
    case 'toBeVisible':
      return ConditionErrors.toBeVisible
    case 'toHaveAttribute':
      return ConditionErrors.toHaveAttribute
    case 'toHaveClass':
      return ConditionErrors.toHaveClass
    case 'toHaveCount':
      return ConditionErrors.toHaveCount
    case 'toHaveCss':
      return ConditionErrors.toHaveCss
    case 'toHaveId':
      return ConditionErrors.toHaveId
    case 'toHaveText':
      return ConditionErrors.toHaveText
    case 'toHaveValue':
      return ConditionErrors.toHaveValue
    default:
      throw new Error(`unexpected function name ${fnName}`)
  }
}
