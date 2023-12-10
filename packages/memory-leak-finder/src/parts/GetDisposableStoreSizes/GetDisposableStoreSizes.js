import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDisposableStores from '../GetDisposableStores/GetDisposableStores.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getDisposableStoreSizes = async (session, objectGroup) => {
  const fnResult1 = await GetDisposableStores.getDisposableStores(session, objectGroup)
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const disposableStores = this

  const getSize = (disposableStore) => {
    return disposableStore._toDispose.size
  }

  const disposableStoresWithSizes = disposableStores.map(getSize)
  return disposableStoresWithSizes
}`,
    objectId: fnResult1.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult2
}
