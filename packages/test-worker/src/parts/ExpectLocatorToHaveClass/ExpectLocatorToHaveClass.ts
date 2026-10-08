import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const toHaveClass = (locator: any, className: any, options: any) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('toHaveClass', locator, {
    className,
    ...options,
  })
}
