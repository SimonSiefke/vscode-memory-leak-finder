import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import { DevtoolsProtocolError } from '../DevtoolsProtocolError/DevtoolsProtocolError.js'
import * as UnwrapDevtoolsEvaluateResult from '../UnwrapDevtoolsEvaluateResult/UnwrapDevtoolsEvaluateResult.js'

/**
 *
 * @param {{expression:string, contextId?:string, generatePreview?:boolean, returnByValue?:boolean, uniqueContextId?:string, allowUnsafeEvalBlockedByCSP?:boolean, arguments?:any[], awaitPromise?:boolean, replMode?:boolean}} options
 * @returns
 */
export const evaluate = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.RuntimeEvaluate, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  if ('exceptionDetails' in rawResult.result) {
    throw new DevtoolsProtocolError(rawResult.result.exceptionDetails.exception.description)
  }
  if (rawResult.result.result.subtype === 'error') {
    throw new DevtoolsProtocolError(rawResult.result.result.description)
  }
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult)
  return result
}
/**
 *
 * @param {{functionDeclaration:string, objectId?:string, arguments?:any[], uniqueContextId?:string, executionContextId?:number, awaitPromise?:boolean, returnByValue?:boolean}} options
 * @returns
 */
export const callFunctionOn = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.RuntimeCallFunctionOn, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  if ('exceptionDetails' in rawResult.result) {
    throw new DevtoolsProtocolError(rawResult.result.exceptionDetails.exception.description)
  }
  if (rawResult.result.result.subtype === 'error') {
    throw new DevtoolsProtocolError(rawResult.result.result.description)
  }
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult)
  return result
}

/**
 *
 * @param {{objectId: string, ownProperties?:boolean, generatePreview?:boolean}} options
 * @returns
 */
export const getProperties = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.RuntimeGetProperties, options)
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult)
  return result
}

/**
 */
export const enable = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.RuntimeEnable)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const runIfWaitingForDebugger = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.RuntimeRunIfWaitingForDebugger)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}
