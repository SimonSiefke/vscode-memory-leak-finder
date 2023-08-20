import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

export const toHaveValue = (locator, value) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveValue', locator, { value })
}
