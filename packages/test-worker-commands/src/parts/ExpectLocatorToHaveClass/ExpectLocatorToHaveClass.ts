import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

export const toHaveClass = (locator, className) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveClass', locator, {
    className,
  })
}
