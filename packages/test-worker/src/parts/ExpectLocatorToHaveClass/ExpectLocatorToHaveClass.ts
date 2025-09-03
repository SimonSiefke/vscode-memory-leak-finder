import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toHaveClass = (locator, className, options) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveClass', locator, {
    className,
    ...options,
  })
}
