import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { VError } from '../VError/VError.ts'

export interface TrackedAllocationStatistic {
  readonly aliveCount: number
  readonly collectedCount: number
  readonly createdCount: number
  readonly location: string
  readonly type: string
}

export type TrackedAllocationStatistics = Record<string, TrackedAllocationStatistic>

export const getTrackedAllocations = async (session: Session): Promise<TrackedAllocationStatistics> => {
  try {
    const result = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: `(() => {
        if (typeof globalThis.getAllocationStatistics === 'function') {
          return globalThis.getAllocationStatistics()
        }
        return {}
      })()`,
      returnByValue: true,
    })

    if (typeof result !== 'object' || result === null) {
      return {}
    }

    return result as TrackedAllocationStatistics
  } catch (error) {
    throw new VError(error, `Failed to get tracked allocations`)
  }
}

export const resetTrackedAllocations = async (session: Session): Promise<void> => {
  try {
    await DevtoolsProtocolRuntime.evaluate(session, {
      expression: `(() => {
        if (typeof globalThis.resetAllocationStatistics === 'function') {
          globalThis.resetAllocationStatistics()
        }
      })()`,
      returnByValue: true,
    })
  } catch (error) {
    throw new VError(error, `Failed to reset tracked allocations`)
  }
}
