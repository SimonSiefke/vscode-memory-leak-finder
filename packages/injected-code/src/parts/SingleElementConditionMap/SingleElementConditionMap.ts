import * as SingleElementConditions from '../SingleElementCondition/SingleElementConditions.ts'

export const getFunction = (fnName: string) => {
  switch (fnName) {
    case 'notToHaveClass':
      return SingleElementConditions.notToHaveClass
    case 'toBeFocused':
      return SingleElementConditions.toBeFocused
    case 'toBeHidden':
      return SingleElementConditions.toBeHidden
    case 'toBeVisible':
      return SingleElementConditions.toBeVisible
    case 'toHaveAttribute':
      return SingleElementConditions.toHaveAttribute
    case 'toHaveClass':
      return SingleElementConditions.toHaveClass
    case 'toHaveCss':
      return SingleElementConditions.toHaveCss
    case 'toHaveId':
      return SingleElementConditions.toHaveId
    case 'toHaveText':
      return SingleElementConditions.toHaveText
    case 'toHaveValue':
      return SingleElementConditions.toHaveValue
    default:
      throw new Error(`unexpected function name ${fnName}`)
  }
}
