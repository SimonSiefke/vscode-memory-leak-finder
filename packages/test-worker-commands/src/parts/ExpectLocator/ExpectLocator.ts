import * as ExpectLocatorIndex from '../ExpectLocatorIndex/ExpectLocatorIndex.js'
import * as RegisterPrototype from '../RegisterPrototype/RegisterPrototype.js'

function ExpectLocator(args) {
  this.context = args
}

RegisterPrototype.registerPrototype(ExpectLocator, ExpectLocatorIndex)

export const expect = (args) => {
  return new ExpectLocator(args)
}
