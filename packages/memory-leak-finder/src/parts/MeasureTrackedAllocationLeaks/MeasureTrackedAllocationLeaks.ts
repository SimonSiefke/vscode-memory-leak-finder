import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as CompareTrackedAllocationLeaks from '../CompareTrackedAllocationLeaks/CompareTrackedAllocationLeaks.ts'
import type { TrackedAllocationResult } from '../CompareTrackedAllocations/CompareTrackedAllocations.ts'
import * as ForceGarbageCollection from '../ForceGarbageCollection/ForceGarbageCollection.ts'
import * as GetTrackedAllocations from '../GetTrackedAllocations/GetTrackedAllocations.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.TrackedAllocationLeaks

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const scriptHandler = ScriptHandler.create()
  return [session, scriptHandler]
}

export const start = async (session: Session, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  await ForceGarbageCollection.forceGarbageCollection(session)
  await GetTrackedAllocations.resetTrackedAllocations(session)
  return {}
}

export const stop = async (session: Session, scriptHandler: IScriptHandler) => {
  await ForceGarbageCollection.forceGarbageCollection(session)
  const trackedAllocations = await GetTrackedAllocations.getTrackedAllocations(session)
  await scriptHandler.stop(session)
  if (Object.keys(trackedAllocations).length === 0) {
    throw new Error(
      'Tracked allocation leaks produced no data. The VS Code workbench was not instrumented, or no instrumented modules were loaded.',
    )
  }
  return {
    scriptMap: scriptHandler.scriptMap,
    trackedAllocations,
  }
}

export const compare = CompareTrackedAllocationLeaks.compareTrackedAllocationLeaks

export const isLeak = () => {
  return false
}

export const summary = (allocations: readonly TrackedAllocationResult[]): string => {
  if (allocations.length === 0) {
    return 'Tracked allocation leak candidates: none'
  }
  const lines = [`Tracked allocation leak candidates: ${allocations.length}`, 'retained | created | collected | type | location']
  for (const allocation of allocations.slice(0, 10)) {
    lines.push(
      `${allocation.aliveCount} | ${allocation.createdCount} | ${allocation.collectedCount} | ${allocation.type} | ${allocation.originalLocation || allocation.location}`,
    )
  }
  return lines.join('\n')
}

export const releaseResources = async (session: Session, scriptHandler: IScriptHandler): Promise<void> => {
  try {
    await scriptHandler.stop(session)
  } catch {
    // Debugger may already be disabled.
  }
}
