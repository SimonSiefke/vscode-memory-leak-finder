import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toHaveClass = (locator, className) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveClass', locator, {
    className,
  })
}
