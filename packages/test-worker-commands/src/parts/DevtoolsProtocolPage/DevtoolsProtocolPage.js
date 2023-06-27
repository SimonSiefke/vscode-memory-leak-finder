import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import { DevtoolsProtocolError } from '../DevtoolsProtocolError/DevtoolsProtocolError.js'

export const setFontSizes = () => {
  throw new Error('not implemented')
}

export const startScreencast = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.PageStartScreenCast, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const stopScreencast = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.PageStopScreenCast, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const enable = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.PageEnable, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const reload = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.PageReload, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

/**
 *
 * @param {{source:string, worldName?:string}} options
 */
export const addScriptToEvaluateOnNewDocument = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.PageAddScriptToEvaluateOnNewDocument, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  return rawResult
}

export const captureScreenshot = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.PageCaptureScreenshot, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  return rawResult.result.data
}

export const close = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.PageClose, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  return rawResult.result.data
}

/**
 *
 * @param {*} rpc
 * @param {{enabled:boolean}} options
 * @returns
 */
export const setLifecycleEventsEnabled = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.PageSetLifecycleEventsEnabled, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  return rawResult.result.data
}
