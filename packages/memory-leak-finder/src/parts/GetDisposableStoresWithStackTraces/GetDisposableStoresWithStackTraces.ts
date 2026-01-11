import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDisposableStores from '../GetDisposableStores/GetDisposableStores.ts'

export const getDisposableStoresWithStackTraces = async (session: Session, objectGroup: string) => {
  const fnResult1 = await GetDisposableStores.getDisposableStores(session, objectGroup)
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const disposableStores = this

  const getStackTrace = disposable => {
    return disposable.___stackTrace || ''
  }

  const getStackTraces = instance => {
    const toDispose=instance._toDispose || new Set()
    const toDisposeArray = [...toDispose]
    const stackTraces = toDisposeArray.map(getStackTrace)
    return stackTraces
  }

  const hasLength = array => {
    return array.length > 0
  }

  const allStackTraces = disposableStores.map(getStackTraces).filter(hasLength)
  return allStackTraces
}`,
    objectGroup,
    objectId: fnResult1.objectId,
    returnByValue: true,
  })
  return fnResult2
}
