import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

const getFullOptions = (text, options) => {
  if (text instanceof RegExp) {
    return { regex: text.source, ...options }
  }
  return { text, ...options }
}

export const toHaveText = (locator, text, options = {}) => {
  const fullOptions = getFullOptions(text, options)
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveText', locator, fullOptions)
}
