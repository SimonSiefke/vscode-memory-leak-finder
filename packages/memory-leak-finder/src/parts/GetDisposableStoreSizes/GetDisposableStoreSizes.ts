import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDisposableStores from '../GetDisposableStores/GetDisposableStores.ts'

export const getDisposableStoreSizes = async (session: Session, objectGroup: string): Promise<number> => {
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
