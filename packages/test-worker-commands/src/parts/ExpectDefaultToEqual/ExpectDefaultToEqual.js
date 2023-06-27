import { ExpectError } from '../ExpectError/ExpectError.js'

export const execute = (args, expected) => {
  if (JSON.stringify(args) !== JSON.stringify(expected)) {
    throw new ExpectError(`the given objects are not equal`)
  }
}
