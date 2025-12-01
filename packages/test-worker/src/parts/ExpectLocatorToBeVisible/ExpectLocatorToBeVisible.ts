import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toBeVisible = (locator, options = {}) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toBeVisible', locator, options)
}
