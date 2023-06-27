import * as ExpectDefaultToBe from '../ExpectDefaultToBe/ExpectDefaultToBe.js'
import * as ExpectDefaultToEqual from '../ExpectDefaultToEqual/ExpectDefaultToEqual.js'

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
