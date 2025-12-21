import * as ExpectElectronAppIndex from '../ExpectElectronAppIndex/ExpectElectronAppIndex.ts'
import * as RegisterPrototype from '../RegisterPrototype/RegisterPrototype.ts'

function ExpectElectronApp(args) {
  this.context = args
}

RegisterPrototype.registerPrototype(ExpectElectronApp, ExpectElectronAppIndex)

export const expect = (args) => {
  return new ExpectElectronApp(args)
}
