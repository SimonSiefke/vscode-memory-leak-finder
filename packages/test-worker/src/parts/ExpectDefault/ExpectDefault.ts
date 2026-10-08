import * as ExpectDefaultToBe from '../ExpectDefaultToBe/ExpectDefaultToBe.ts'
import * as ExpectDefaultToEqual from '../ExpectDefaultToEqual/ExpectDefaultToEqual.ts'

export const expect = (args: any) => {
  return {
    toBe(expected: any) {
      return ExpectDefaultToBe.execute(args, expected)
    },
    toEqual(expected: any) {
      return ExpectDefaultToEqual.execute(args, expected)
    },
  }
}
