import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toBeFocused = (locator: any, options = {}) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toBeFocused', locator, options)
}
