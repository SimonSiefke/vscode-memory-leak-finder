import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDisposableStores from '../GetDisposableStores/GetDisposableStores.ts'

export const stopTrackingDisposableStores = async (session, objectGroup) => {
  const fnResult1 = await GetDisposableStores.getDisposableStores(session, objectGroup)
  await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const disposableStores = this

  if(disposableStores.length === 0){
    throw new Error("no disposable stores found")
  }

  const first = disposableStores[0]
  const prototype = first.constructor
  prototype.prototype.add = globalThis.___disposableStoreOriginalAdd

  delete globalThis.___disposableStoreOriginalAdd
}`,
    objectId: fnResult1.objectId,
    returnByValue: false,
    objectGroup,
  })
}
