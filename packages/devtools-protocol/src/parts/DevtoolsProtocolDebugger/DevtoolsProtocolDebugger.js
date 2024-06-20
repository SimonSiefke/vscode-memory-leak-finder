import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import { DevtoolsProtocolError } from '../DevtoolsProtocolError/DevtoolsProtocolError.js'

export const enable = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.DebuggerEnable)
  return rawResult.result.debuggerId
}

export const disable = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.DebuggerDisable)
}

export const pause = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.DebuggerPause)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const resume = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.DebuggerResume)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const stepInto = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.DebuggerStepInto)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const stepOver = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.DebuggerStepOver)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const stepOut = async (rpc) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.DebuggerStepOut)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const setPauseOnExceptions = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.DebuggerSetPauseOnExceptions, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

/**
 *
 * @param {{callFrameId:string, expression:string, generatePreview?:boolean, includeCommandLineAPI?:boolean}} params
 * @returns
 */
export const evaluateOnCallFrame = async (rpc, params) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.DebuggerEvaluateOnCallFrame, params)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  if ('exceptionDetails' in rawResult.result) {
    throw new DevtoolsProtocolError(rawResult.result.exceptionDetails.exception.description)
  }
  return rawResult
}
