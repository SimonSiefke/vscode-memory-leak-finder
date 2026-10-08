import * as ExpectElectronAppIndex from '../ExpectElectronAppIndex/ExpectElectronAppIndex.ts'
import * as RegisterPrototype from '../RegisterPrototype/RegisterPrototype.ts'

function ExpectElectronApp(this: { context: any }, args: any) {
  this.context = args
}

RegisterPrototype.registerPrototype(ExpectElectronApp, ExpectElectronAppIndex)

export const expect = (args: any) => {
  return new (ExpectElectronApp as unknown as new (args: any) => any)(args)
}
