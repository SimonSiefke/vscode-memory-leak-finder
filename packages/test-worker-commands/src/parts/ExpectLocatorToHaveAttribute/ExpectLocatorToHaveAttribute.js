import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

export const toHaveAttribute = (locator, key, value, options = {}) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveAttribute', locator, { key, value, ...options })
}
