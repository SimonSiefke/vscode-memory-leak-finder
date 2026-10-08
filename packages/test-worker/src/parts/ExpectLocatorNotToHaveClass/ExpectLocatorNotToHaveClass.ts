import * as ExpectLocatorSingleElementCondition from '../ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.ts'

export const notToHaveClass = (locator: any, className: any) => {
  return ExpectLocatorSingleElementCondition.checkSingleElementCondition('notToHaveClass', locator, {
    className,
  })
}
