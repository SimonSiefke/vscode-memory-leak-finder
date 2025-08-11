import * as ExpectLocatorMultiElementCondition from '../ExpectLocatorMultiElementCondition/ExpectLocatorMultiElementCondition.js'
import * as Assert from '../Assert/Assert.js'

export const toHaveCount = (locator, count, options = {}) => {
  Assert.number(count)
  return ExpectLocatorMultiElementCondition.checkMultiElementCondition('toHaveCount', locator, { count, ...options })
}
