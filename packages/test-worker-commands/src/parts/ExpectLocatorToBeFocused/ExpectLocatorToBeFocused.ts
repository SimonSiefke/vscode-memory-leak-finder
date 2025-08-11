import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toBeFocused = (locator, options = {}) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toBeFocused', locator, options)
}
