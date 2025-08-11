import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

export const toBeVisible = (locator, options = {}) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toBeVisible', locator, options)
}
