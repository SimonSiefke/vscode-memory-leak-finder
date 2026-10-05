import { ExpectError } from '../ExpectError/ExpectError.ts'

export const execute = (args: any, expected: any) => {
  if (JSON.stringify(args) !== JSON.stringify(expected)) {
    throw new ExpectError(`the given objects are not equal`)
  }
}
