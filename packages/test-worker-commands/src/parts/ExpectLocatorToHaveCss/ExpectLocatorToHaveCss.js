import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

export const toHaveCss = (locator, key, value, options = {}) => {
  if (typeof value === 'string') {
    value = value.trim()
  }
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveCss', locator, { key, value, ...options })
}
