import * as ExpectDefaultToBe from '../ExpectDefaultToBe/ExpectDefaultToBe.ts'
import * as ExpectDefaultToEqual from '../ExpectDefaultToEqual/ExpectDefaultToEqual.ts'

export const expect = (args) => {
  return {
    toBe(expected) {
      return ExpectDefaultToBe.execute(args, expected)
    },
    toEqual(expected) {
      return ExpectDefaultToEqual.execute(args, expected)
    },
  }
}
