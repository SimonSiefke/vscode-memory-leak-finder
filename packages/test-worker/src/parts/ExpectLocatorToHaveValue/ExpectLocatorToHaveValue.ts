import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toHaveValue = (locator: any, value: any) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveValue', locator, { value })
}
