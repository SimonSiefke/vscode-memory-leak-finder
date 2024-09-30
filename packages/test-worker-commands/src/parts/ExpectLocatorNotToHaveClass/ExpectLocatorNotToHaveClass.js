import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js'

export const notToHaveClass = (locator, className) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('notToHaveClass', locator, {
    className,
  })
}
