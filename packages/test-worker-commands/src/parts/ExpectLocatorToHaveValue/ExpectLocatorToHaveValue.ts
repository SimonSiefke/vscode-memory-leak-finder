import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toHaveValue = (locator, value) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveValue', locator, { value })
}
