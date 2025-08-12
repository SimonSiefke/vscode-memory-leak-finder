import * as ExpectLocatorIndex from '../ExpectLocatorIndex/ExpectLocatorIndex.ts'
import * as RegisterPrototype from '../RegisterPrototype/RegisterPrototype.ts'

function ExpectLocator(args) {
  this.context = args
}

RegisterPrototype.registerPrototype(ExpectLocator, ExpectLocatorIndex)

export const expect = (args) => {
  return new ExpectLocator(args)
}
