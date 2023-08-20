import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

export const toBeFocused = (locator, options = {}) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toBeFocused', locator, options)
}
