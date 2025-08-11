import { ExpectError } from '../ExpectError/ExpectError.js'

export const execute = (args, expected) => {
  if (args !== expected) {
    throw new ExpectError(`expected ${args} to be ${expected}`)
  }
}
