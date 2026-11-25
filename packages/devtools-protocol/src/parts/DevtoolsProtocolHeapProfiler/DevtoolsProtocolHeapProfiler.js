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

export const collectGarbage = (session) => {
  return Invoke.invoke(session, DevtoolsCommandType.HeapProfilerCollectGarbage, {})
}

export const getHeapObjectId = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.HeapProfilerGetHeapObjectId, options)
}

export const startTrackingHeapObjects = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.HeapProfilerStartTrackingHeapObjects, options)
}

export const stopTrackingHeapObjects = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.HeapProfilerStopTrackingHeapObjects, options)
}

/**
 *
 * @param {{samplingInterval?:number, includeObjectsCollectedByMajorGC?:boolean, includeObjectsCollectedByMinorGC?:boolean}} options
 * @returns
 */
export const startSampling = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.HeapProfilerStartSampling, options)
}

export const getSamplingProfile = (session) => {
  return Invoke.invoke(session, DevtoolsCommandType.HeapProfilerGetSamplingProfile, {})
}

export const stopSampling = (session) => {
  return Invoke.invoke(session, DevtoolsCommandType.HeapProfilerStopSampling, {})
}
