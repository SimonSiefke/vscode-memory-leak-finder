import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const notToHaveClass = (locator, className) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('notToHaveClass', locator, {
    className,
  })
}
