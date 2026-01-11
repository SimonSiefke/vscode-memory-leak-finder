import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

/**
 *
 * @param {{exposeInternals?:boolean, reportProgress?:boolean}} options
 * @returns
 */
export const takeHeapSnapshot = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.HeapProfilerTakeHeapSnapshot, options)
}

export const disable = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.HeapProfilerDisable, options)
}

export const enable = (session) => {
  return Invoke.invoke(session, DevtoolsCommandType.HeapProfilerEnable, {})
}
