import * as Assert from '../Assert/Assert.ts'
import * as ExpectLocatorMultiElementCondition from '../ExpectLocatorMultiElementCondition/ExpectLocatorMultiElementCondition.ts'

export const toHaveCount = (locator: any, count: number, options = {}) => {
  Assert.number(count)
  return ExpectLocatorMultiElementCondition.checkMultiElementCondition('toHaveCount', locator, { count, ...options })
}
