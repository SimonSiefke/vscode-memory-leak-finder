import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

export const getDomCounters = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.MemoryGetDomCounters, options)
}

export const getSamplingProfile = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.MemoryGetSamplingProfile, options)
}

export const startSampling = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.MemoryStartSampling, options)
}

export const stopSampling = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.MemoryStopSampling, options)
}
