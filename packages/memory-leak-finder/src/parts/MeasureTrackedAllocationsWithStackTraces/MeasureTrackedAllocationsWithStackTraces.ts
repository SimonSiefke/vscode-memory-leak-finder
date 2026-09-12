import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as ForceGarbageCollection from '../ForceGarbageCollection/ForceGarbageCollection.ts'
import * as GetTrackedAllocations from '../GetTrackedAllocations/GetTrackedAllocations.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.TrackedAllocationsWithStackTraces

export const targets = [TargetId.Browser]

interface TrackedAllocationStackState {
  runCompletions: number
  readonly scriptHandler: IScriptHandler
  selectedLocations: readonly string[]
  stackTrackingEnabled: boolean
}

const TrackedSiteLimit = 10

export const create = (session: Session) => {
  const state: TrackedAllocationStackState = {
    runCompletions: 0,
    scriptHandler: ScriptHandler.create(),
    selectedLocations: [],
    stackTrackingEnabled: false,
  }
  return [session, state]
}

export const start = async (session: Session, state: TrackedAllocationStackState) => {
  await state.scriptHandler.start(session)
  await ForceGarbageCollection.forceGarbageCollection(session)
  await GetTrackedAllocations.resetTrackedAllocations(session)
  await GetTrackedAllocations.setTrackedAllocationStackTrackingEnabled(session, false)
  return []
}

export const runCompletion = async (session: Session, state: TrackedAllocationStackState): Promise<void> => {
  state.runCompletions++
  if (state.stackTrackingEnabled) {
    return
  }
  const allocations = await GetTrackedAllocations.getTrackedAllocations(session)
  state.selectedLocations = Object.values(allocations)
    .toSorted((a, b) => b.createdCount - a.createdCount)
    .slice(0, TrackedSiteLimit)
    .map((entry) => entry.location)
  if (state.selectedLocations.length === 0) {
    throw new Error(
      'Tracked allocations with stack traces produced no profiling data. The VS Code workbench was not instrumented, or no instrumented modules were loaded.',
    )
  }
  await GetTrackedAllocations.resetTrackedAllocations(session)
  await GetTrackedAllocations.setTrackedAllocationStackTrackingEnabled(session, true, state.selectedLocations)
  state.stackTrackingEnabled = true
}

export const stop = async (session: Session, state: TrackedAllocationStackState) => {
  let trackedAllocationStacks
  try {
    await GetTrackedAllocations.setTrackedAllocationStackTrackingEnabled(session, false)
    trackedAllocationStacks = await GetTrackedAllocations.getTrackedAllocationStacks(session)
  } finally {
    await GetTrackedAllocations.setTrackedAllocationStackTrackingEnabled(session, false)
    await state.scriptHandler.stop(session)
  }
  if (trackedAllocationStacks.length === 0) {
    throw new Error(
      'Tracked allocations with stack traces produced no trace data. Use at least two runs so the first can select the hottest allocation sites.',
    )
  }
  return {
    profiledRuns: Math.min(1, state.runCompletions),
    scriptMap: state.scriptHandler.scriptMap,
    selectedAllocationSites: state.selectedLocations,
    trackedAllocationStacks,
    tracedRuns: Math.max(0, state.runCompletions - 1),
  }
}

export { compareTrackedAllocationStacks as compare } from '../CompareTrackedAllocationStacks/CompareTrackedAllocationStacks.ts'

export const releaseResources = async (session: Session, state: TrackedAllocationStackState): Promise<void> => {
  try {
    await GetTrackedAllocations.setTrackedAllocationStackTrackingEnabled(session, false)
  } catch {
    // The target may already be closed.
  }
  try {
    await state.scriptHandler.stop(session)
  } catch {
    // Debugger may already be disabled.
  }
}
