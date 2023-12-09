import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDisposables from '../GetDisposables/GetDisposables.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getDisposableCount = async (session, objectGroup) => {
  const fnResult1 = await GetDisposables.getDisposables(session, objectGroup)
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const disposables = this
  return disposables.length
}`,
    objectId: fnResult1.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult2
}
