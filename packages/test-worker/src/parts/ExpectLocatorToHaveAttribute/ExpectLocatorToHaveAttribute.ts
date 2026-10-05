import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toHaveAttribute = (locator: any, key: string, value: any, options = {}) => {
  if (value instanceof RegExp) {
    // @ts-ignore
    options.isRegex = true
    value = value.toString()
  }
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveAttribute', locator, { key, value, ...options })
}
