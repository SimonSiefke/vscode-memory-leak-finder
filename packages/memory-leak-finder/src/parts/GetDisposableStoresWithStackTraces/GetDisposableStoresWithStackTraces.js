import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDisposableStores from '../GetDisposableStores/GetDisposableStores.js'

export const getDisposableStoresWithStackTraces = async (session, objectGroup) => {
  const fnResult1 = await GetDisposableStores.getDisposableStores(session, objectGroup)
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const disposableStores = this

  const getStackTraces = instance => {
    return instance.___stackTraces || []
  }

  const hasLength = array => {
    return array.length > 0
  }

  const allStackTraces = disposableStores.map(getStackTraces).filter(hasLength)
  return allStackTraces
}`,
    objectId: fnResult1.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult2
}
