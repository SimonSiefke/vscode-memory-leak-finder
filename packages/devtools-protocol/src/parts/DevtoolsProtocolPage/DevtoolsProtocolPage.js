import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

export const setFontSizes = () => {
  throw new Error('not implemented')
}

export const startScreencast = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.PageStartScreenCast, options)
}

export const screencastFrameAck = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.PageScreencastFrameAck, options)
}

export const stopScreencast = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.PageStopScreenCast, options)
}

export const enable = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.PageEnable, options)
}

export const reload = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.PageReload, options)
}

/**
 *
 * @param {{source:string, worldName?:string}} options
 */
export const addScriptToEvaluateOnNewDocument = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.PageAddScriptToEvaluateOnNewDocument, options)
}

export const captureScreenshot = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.PageCaptureScreenshot, options)
}

export const close = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.PageClose, options)
}

/**
 *
 * @param {*} rpc
 * @param {{enabled:boolean}} options
 * @returns
 */
export const setLifecycleEventsEnabled = (rpc, options) => {
  return Invoke.invoke(rpc, DevtoolsCommandType.PageSetLifecycleEventsEnabled, options)
}
