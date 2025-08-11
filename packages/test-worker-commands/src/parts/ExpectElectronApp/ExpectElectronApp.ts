import * as ExpectElectronAppIndex from '../ExpectElectronAppIndex/ExpectElectronAppIndex.js'
import * as RegisterPrototype from '../RegisterPrototype/RegisterPrototype.js'

function ExpectElectronApp(args) {
  this.context = args
}

RegisterPrototype.registerPrototype(ExpectElectronApp, ExpectElectronAppIndex)

export const expect = (args) => {
  return new ExpectElectronApp(args)
}
