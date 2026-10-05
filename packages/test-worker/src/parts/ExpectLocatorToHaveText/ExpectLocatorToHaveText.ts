import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

const getFullOptions = (text: string | RegExp, options: any) => {
  if (text instanceof RegExp) {
    return { regex: text.source, ...options }
  }
  return { text, ...options }
}

export const toHaveText = (locator: any, text: string | RegExp, options = {}) => {
  const fullOptions = getFullOptions(text, options)
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveText', locator, fullOptions)
}
