import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as NativeAllocationProfile from '../NativeAllocationProfile/NativeAllocationProfile.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { DevtoolsProtocolErrorCodes, DevtoolsProtocolMemory } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

interface NativeAllocationProfileState {
  active: boolean
  supported: boolean
  unsupportedReason: string
}

const SamplingInterval = 32 * 1024
const EmptyProfile = {
  modules: [],
  samples: [],
}

export const id = MeasureId.NativeAllocationProfile

export const targets = [TargetId.Browser]

const isMethodNotFoundError = (error: Dynamic): boolean => {
  return error?.code === DevtoolsProtocolErrorCodes.E_DEVTOOLS_METHOD_NOT_FOUND
}

const getUnsupportedReason = (error: Dynamic): string => {
  const message = typeof error?.message === 'string' ? error.message : 'CDP Memory sampling is unavailable'
  return `CDP Memory sampling is unavailable: ${message}`
}

const setUnsupported = (state: NativeAllocationProfileState, error: Dynamic): void => {
  state.supported = false
  state.unsupportedReason = getUnsupportedReason(error)
}

const stopActiveSampler = async (session: Session, state: NativeAllocationProfileState): Promise<void> => {
  if (!state.active) {
    return
  }
  await DevtoolsProtocolMemory.stopSampling(session, {})
  state.active = false
}

const getEmptySummary = (state: NativeAllocationProfileState) => {
  return NativeAllocationProfile.getNativeAllocationProfileSummary(EmptyProfile, state.supported, state.unsupportedReason)
}

export const create = (session: Session) => {
  const state: NativeAllocationProfileState = {
    active: false,
    supported: true,
    unsupportedReason: '',
  }
  return [session, state]
}

export const start = async (session: Session, state: NativeAllocationProfileState) => {
  try {
    await DevtoolsProtocolMemory.startSampling(session, {
      samplingInterval: SamplingInterval,
      suppressRandomness: false,
    })
    state.active = true
    return getEmptySummary(state)
  } catch (error) {
    if (!isMethodNotFoundError(error)) {
      throw error
    }
    setUnsupported(state, error)
    return getEmptySummary(state)
  }
}

export const stop = async (session: Session, state: NativeAllocationProfileState) => {
  if (!state.supported) {
    return getEmptySummary(state)
  }
  let profile: Dynamic
  let profileError: Dynamic
  try {
    const result = await DevtoolsProtocolMemory.getSamplingProfile(session, {})
    profile = result?.profile || result
  } catch (error) {
    profileError = error
  }
  let cleanupError: Dynamic
  try {
    await stopActiveSampler(session, state)
  } catch (error) {
    cleanupError = error
  }
  const unexpectedError = [profileError, cleanupError].find((error) => error && !isMethodNotFoundError(error))
  if (unexpectedError) {
    throw unexpectedError
  }
  const unsupportedError = profileError || cleanupError
  if (unsupportedError) {
    state.active = false
    setUnsupported(state, unsupportedError)
    return getEmptySummary(state)
  }
  return NativeAllocationProfile.getNativeAllocationProfileSummary(profile, true, '')
}

export const releaseResources = async (session: Session, state: NativeAllocationProfileState) => {
  try {
    await stopActiveSampler(session, state)
  } catch (error) {
    if (!isMethodNotFoundError(error)) {
      throw error
    }
    state.active = false
    setUnsupported(state, error)
  }
}

export const compare = (
  before: NativeAllocationProfile.NativeAllocationProfileSummary,
  after: NativeAllocationProfile.NativeAllocationProfileSummary,
): NativeAllocationProfile.NativeAllocationProfileResult => {
  return {
    isLeak: false,
    metrics: after.metrics,
    modules: after.modules,
    raw: {
      after: after.rawProfile,
      before: before.rawProfile,
    },
    supported: after.supported,
    topStacks: after.topStacks,
    unsupportedReason: after.unsupportedReason,
  }
}

export const isLeak = () => {
  return false
}

export const summary = ({ metrics, supported, topStacks, unsupportedReason }: NativeAllocationProfile.NativeAllocationProfileDisplay) => {
  return NativeAllocationProfile.formatNativeAllocationProfileSummary({
    metrics,
    supported,
    topStacks,
    unsupportedReason,
  })
}
