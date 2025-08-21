import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toHaveCss = (locator, key, value, options = {}) => {
  if (typeof value === 'string') {
    value = value.trim()
  }
  if (value instanceof RegExp) {
    // @ts-ignore
    options.isRegex = true
    value = value.toString()
  }
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveCss', locator, { key, value, ...options })
}
