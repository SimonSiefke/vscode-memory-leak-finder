import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

export const toHaveCss = (locator, key, value, options = {}) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveCss', locator, { key, value, ...options })
}
