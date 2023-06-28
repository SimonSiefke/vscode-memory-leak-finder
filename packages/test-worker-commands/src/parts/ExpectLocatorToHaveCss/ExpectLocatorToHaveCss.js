import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

export const toHaveCss = (locator, key, value) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveCss', locator, { key, value })
}
