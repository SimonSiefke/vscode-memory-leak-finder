import { ExpectError } from '../ExpectError/ExpectError.ts'

export const execute = (args: any, expected: any) => {
  if (args !== expected) {
    throw new ExpectError(`expected ${args} to be ${expected}`)
  }
}
