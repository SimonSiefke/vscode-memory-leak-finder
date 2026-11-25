import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as SampledAllocationChurn from '../SampledAllocationChurn/SampledAllocationChurn.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { DevtoolsProtocolErrorCodes, DevtoolsProtocolHeapProfiler, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

interface SampledAllocationChurnState {
  enabled: boolean
  sampling: boolean
  supported: boolean
  unsupportedReason: string
}

export const SamplingInterval = 32 * 1024

// The self-check allocates about 4 MiB of short-lived objects. Runtimes that silently ignore the
// includeObjectsCollectedBy* flags drop those samples on garbage collection and report far less.
export const MinSelfCheckBytes = 1024 * 1024

export const SelfCheckExpression = `(() => {
  let count = 0
  for (let round = 0; round < 32; round++) {
    const items = []
    for (let index = 0; index < 2000; index++) {
      items.push({ round, index, text: 'x' + index })
    }
    count += items.length
  }
  return count
})()`

const NotStartedMessage = 'sampling heap profiler was not started'

export const id = MeasureId.SampledAllocationChurn

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

const getSamplingOptions = () => {
  return {
    includeObjectsCollectedByMajorGC: true,
    includeObjectsCollectedByMinorGC: true,
    samplingInterval: SamplingInterval,
  }
}

const isMethodNotFoundError = (error: Dynamic): boolean => {
  return error?.code === DevtoolsProtocolErrorCodes.E_DEVTOOLS_METHOD_NOT_FOUND
}

const isNotStartedError = (error: Dynamic): boolean => {
  return (
    error?.code === DevtoolsProtocolErrorCodes.E_DEVTOOLS_INTERNAL_ERROR &&
    typeof error?.message === 'string' &&
    error.message.includes(NotStartedMessage)
  )
}

const isUnavailableError = (error: Dynamic): boolean => {
  return isMethodNotFoundError(error) || isNotStartedError(error)
}

const getErrorMessage = (error: Dynamic): string => {
  return typeof error?.message === 'string' ? error.message : String(error)
}

const setUnsupported = (state: SampledAllocationChurnState, reason: string): void => {
  state.supported = false
  state.unsupportedReason = reason
}

const getEmptySummary = (state: SampledAllocationChurnState): SampledAllocationChurn.SampledAllocationChurnSummary => {
  return SampledAllocationChurn.getSampledAllocationChurnSummary(undefined, SamplingInterval, state.supported, state.unsupportedReason)
}

const startSampling = async (session: Session, state: SampledAllocationChurnState): Promise<void> => {
  await DevtoolsProtocolHeapProfiler.startSampling(session, getSamplingOptions())
  state.sampling = true
}

const stopSampling = async (session: Session, state: SampledAllocationChurnState): Promise<void> => {
  if (!state.sampling) {
    return
  }
  state.sampling = false
  try {
    await DevtoolsProtocolHeapProfiler.stopSampling(session)
  } catch (error) {
    if (!isUnavailableError(error)) {
      throw error
    }
  }
}

const getProfile = async (session: Session): Promise<Dynamic> => {
  const result = await DevtoolsProtocolHeapProfiler.getSamplingProfile(session)
  return result?.profile
}

const runSelfCheck = async (session: Session, state: SampledAllocationChurnState): Promise<number> => {
  await startSampling(session, state)
  try {
    await DevtoolsProtocolRuntime.evaluate(session, {
      expression: SelfCheckExpression,
      returnByValue: true,
    })
    await DevtoolsProtocolHeapProfiler.collectGarbage(session)
    const profile = await getProfile(session)
    return SampledAllocationChurn.getSampledProfileBytes(profile)
  } finally {
    await stopSampling(session, state)
  }
}

export const create = (session: Session) => {
  const state: SampledAllocationChurnState = {
    enabled: false,
    sampling: false,
    supported: true,
    unsupportedReason: '',
  }
  return [session, state]
}

export const start = async (session: Session, state: SampledAllocationChurnState) => {
  try {
    await DevtoolsProtocolHeapProfiler.enable(session)
    state.enabled = true
    const selfCheckBytes = await runSelfCheck(session, state)
    if (selfCheckBytes < MinSelfCheckBytes) {
      setUnsupported(
        state,
        `HeapProfiler sampling did not retain collected objects: the self-check sampled ${Math.round(selfCheckBytes)} bytes, expected at least ${MinSelfCheckBytes}`,
      )
      return getEmptySummary(state)
    }
    await startSampling(session, state)
    return getEmptySummary(state)
  } catch (error) {
    if (!isUnavailableError(error)) {
      throw error
    }
    await stopSampling(session, state)
    setUnsupported(state, `HeapProfiler sampling is unavailable: ${getErrorMessage(error)}`)
    return getEmptySummary(state)
  }
}

export const stop = async (session: Session, state: SampledAllocationChurnState) => {
  if (!state.supported) {
    return getEmptySummary(state)
  }
  let profile: Dynamic
  try {
    profile = await getProfile(session)
  } catch (error) {
    if (!isUnavailableError(error)) {
      throw error
    }
    setUnsupported(state, `HeapProfiler sampling profile is unavailable: ${getErrorMessage(error)}`)
    return getEmptySummary(state)
  } finally {
    await stopSampling(session, state)
  }
  return SampledAllocationChurn.getSampledAllocationChurnSummary(profile, SamplingInterval)
}

export const releaseResources = async (session: Session, state: SampledAllocationChurnState) => {
  await stopSampling(session, state)
  if (!state.enabled) {
    return
  }
  state.enabled = false
  try {
    await DevtoolsProtocolHeapProfiler.disable(session, {})
  } catch (error) {
    if (!isMethodNotFoundError(error)) {
      throw error
    }
  }
}

export const compare = (
  _before: SampledAllocationChurn.SampledAllocationChurnSummary,
  after: SampledAllocationChurn.SampledAllocationChurnSummary,
): SampledAllocationChurn.SampledAllocationChurnResult => {
  return {
    isLeak: false,
    metrics: after.metrics,
    samplingIntervalBytes: after.samplingIntervalBytes,
    supported: after.supported,
    topSelfBytes: after.topSelfBytes,
    topStacks: after.topStacks,
    unsupportedReason: after.unsupportedReason,
  }
}

export const isLeak = () => {
  return false
}

export const summary = (result: SampledAllocationChurn.SampledAllocationChurnSummary) => {
  return SampledAllocationChurn.formatSampledAllocationChurnSummary(result)
}
