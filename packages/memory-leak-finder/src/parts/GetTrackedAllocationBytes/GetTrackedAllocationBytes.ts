import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export interface TrackedAllocationByteStatistic {
  readonly createdCount: number
  readonly estimatedBytes: number
  readonly unknownCount: number
  readonly location: string
  readonly type: string
}

export type TrackedAllocationByteStatistics = Record<string, TrackedAllocationByteStatistic>

export const getTrackedAllocationBytes = async (session: Session): Promise<TrackedAllocationByteStatistics> => {
  const result = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `typeof globalThis.getAllocationByteStatistics === 'function' ? globalThis.getAllocationByteStatistics() : null`,
    returnByValue: true,
  })
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error(
      'Tracked allocation bytes are unavailable. Launch with --measure trackedAllocationBytes to enable byte instrumentation.',
    )
  }
  return result as TrackedAllocationByteStatistics
}

export const resetTrackedAllocationBytes = async (session: Session): Promise<void> => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `globalThis.resetAllocationByteStatistics()`,
    returnByValue: true,
  })
}
