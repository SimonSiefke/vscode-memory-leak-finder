import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toHaveAttribute = (locator, key, value, options = {}) => {
  if (value instanceof RegExp) {
    options.isRegex = true
    value = value.toString()
  }
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveAttribute', locator, { key, value, ...options })
}
