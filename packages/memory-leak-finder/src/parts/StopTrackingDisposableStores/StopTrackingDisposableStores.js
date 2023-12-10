import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDisposableStores from '../GetDisposableStores/GetDisposableStores.js'

export const stopTrackingDisposableStores = async (session, objectGroup) => {
  const fnResult1 = await GetDisposableStores.getDisposableStores(session, objectGroup)
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const disposableStores = this

  if(disposableStores.length === 0){
    throw new Error("no disposable stores found")
  }

  const first = disposableStores[0]
  const prototype = first.constructor
  prototype.add = globalThis.___originalDisposableStoreAdd

  delete globalThis.___originalDisposableStoreAdd
}`,
    objectId: fnResult1.objectId,
    returnByValue: false,
    objectGroup,
  })
}
