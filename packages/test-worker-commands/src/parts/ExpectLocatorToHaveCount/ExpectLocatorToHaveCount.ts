import * as ExpectLocatorMultiElementCondition from '../ExpectLocatorMultiElementCondition/ExpectLocatorMultiElementCondition.ts'
import * as Assert from '../Assert/Assert.ts'

export const toHaveCount = (locator, count, options = {}) => {
  Assert.number(count)
  return ExpectLocatorMultiElementCondition.checkMultiElementCondition('toHaveCount', locator, { count, ...options })
}
