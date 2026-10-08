import * as ExpectLocatorIndex from '../ExpectLocatorIndex/ExpectLocatorIndex.ts'
import * as RegisterPrototype from '../RegisterPrototype/RegisterPrototype.ts'

function ExpectLocator(this: { context: any }, args: any) {
  this.context = args
}

RegisterPrototype.registerPrototype(ExpectLocator, ExpectLocatorIndex)

export const expect = (args: any) => {
  return new (ExpectLocator as unknown as new (args: any) => any)(args)
}
