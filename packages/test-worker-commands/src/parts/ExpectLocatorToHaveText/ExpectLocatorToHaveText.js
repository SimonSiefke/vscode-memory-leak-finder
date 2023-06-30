import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

export const toHaveText = (locator, text, options = {}) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveText', locator, { text, ...options })
}
