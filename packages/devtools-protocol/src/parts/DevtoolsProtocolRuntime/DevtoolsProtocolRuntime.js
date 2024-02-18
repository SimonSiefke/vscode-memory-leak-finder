import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

/**
 *
 * @param {{expression:string, contextId?:string, generatePreview?:boolean, returnByValue?:boolean, uniqueContextId?:string, allowUnsafeEvalBlockedByCSP?:boolean, arguments?:any[], awaitPromise?:boolean, replMode?:boolean, includeCommandLineAPI?:boolean, objectGroup?:any}} options
 * @returns
 */
export const evaluate = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.RuntimeEvaluate, options)
}

/**
 *
 * @param {{functionDeclaration:string, objectId?:string, arguments?:any[], uniqueContextId?:string, executionContextId?:number, awaitPromise?:boolean, returnByValue?:boolean, objectGroup?:string}} options
 * @returns
 */
export const callFunctionOn = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.RuntimeCallFunctionOn, options)
}

/**
 *
 * @param {{objectId: string, ownProperties?:boolean, generatePreview?:boolean, accessorPropertiesOnly?:boolean, nonIndexedPropertiesOnly?: boolean}} options
 * @returns
 */
export const getProperties = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.RuntimeGetProperties, options)
}

/**
 */
export const enable = (session) => {
  return Invoke.invoke(session, DevtoolsCommandType.RuntimeEnable, {})
}

export const runIfWaitingForDebugger = (session) => {
  return Invoke.invoke(session, DevtoolsCommandType.RuntimeRunIfWaitingForDebugger, {})
}

/**
 *
 * @param {{prototypeObjectId:string, objectGroup?:string}} options
 * @returns
 */
export const queryObjects = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.RuntimeQueryObjects, options)
}

/**
 *
 * @param {{objectGroup:string}} options
 * @returns
 */
export const releaseObjectGroup = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.RuntimeReleaseObjectGroup, options)
}

export const getHeapUsage = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.RuntimeGetHeapUsage, options)
}
