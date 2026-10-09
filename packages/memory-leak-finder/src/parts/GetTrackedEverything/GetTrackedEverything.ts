import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { VError } from '../VError/VError.ts'

export interface TrackedEverythingSite {
  readonly id: number
  readonly location: string
  readonly type: string
}

export interface TrackedEverythingTimeMark {
  readonly elapsedMs: number
  readonly eventIndex: number
}

export interface TrackedEverythingMetadata {
  readonly chunkCount: number
  readonly durationMs: number
  readonly eventCount: number
  readonly sites: readonly TrackedEverythingSite[]
  readonly timeMarks: readonly TrackedEverythingTimeMark[]
}

const emptyMetadata: TrackedEverythingMetadata = {
  chunkCount: 0,
  durationMs: 0,
  eventCount: 0,
  sites: [],
  timeMarks: [],
}

export const getTrackedEverythingMetadata = async (session: Session): Promise<TrackedEverythingMetadata> => {
  try {
    const result = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: `(() => {
        if (typeof globalThis.__vscodeMemoryLeakFinderGetTrackedEverythingMetadata === 'function') {
          return globalThis.__vscodeMemoryLeakFinderGetTrackedEverythingMetadata()
        }
        return null
      })()`,
      returnByValue: true,
    })
    if (!result || typeof result !== 'object') {
      return emptyMetadata
    }
    return result as TrackedEverythingMetadata
  } catch (error) {
    throw new VError(error, `Failed to get tracked-everything metadata`)
  }
}

export const getTrackedEverythingChunk = async (session: Session, index: number): Promise<readonly number[]> => {
  try {
    const result = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: `(() => {
        if (typeof globalThis.__vscodeMemoryLeakFinderGetTrackedEverythingChunk === 'function') {
          return globalThis.__vscodeMemoryLeakFinderGetTrackedEverythingChunk(${index})
        }
        return []
      })()`,
      returnByValue: true,
    })
    return Array.isArray(result) ? result : []
  } catch (error) {
    throw new VError(error, `Failed to get tracked-everything event chunk ${index}`)
  }
}
