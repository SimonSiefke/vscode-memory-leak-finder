import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as CompareTrackedAllocationPerformance from '../CompareTrackedAllocationPerformance/CompareTrackedAllocationPerformance.ts'
import type { TrackedAllocationPerformanceResult } from '../CompareTrackedAllocationPerformance/CompareTrackedAllocationPerformance.ts'
import { DevtoolsProtocolProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ForceGarbageCollection from '../ForceGarbageCollection/ForceGarbageCollection.ts'
import * as GetTrackedAllocations from '../GetTrackedAllocations/GetTrackedAllocations.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface TrackedAllocationPerformanceState {
  profilerEnabled: boolean
  profilerStarted: boolean
  readonly scriptHandler: IScriptHandler
}

export const id = MeasureId.TrackedAllocationPerformance

export const targets = [TargetId.Browser]

export const create = (session: Session): readonly [Session, TrackedAllocationPerformanceState] => {
  return [
    session,
    {
      profilerEnabled: false,
      profilerStarted: false,
      scriptHandler: ScriptHandler.create(),
    },
  ]
}

export const start = async (session: Session, state: TrackedAllocationPerformanceState) => {
  await state.scriptHandler.start(session)
  await ForceGarbageCollection.forceGarbageCollection(session)
  await GetTrackedAllocations.resetTrackedAllocations(session)
  await DevtoolsProtocolProfiler.enable(session, {})
  state.profilerEnabled = true
  await DevtoolsProtocolProfiler.start(session, {})
  state.profilerStarted = true
  return {}
}

export const stop = async (session: Session, state: TrackedAllocationPerformanceState) => {
  const profileResult = await DevtoolsProtocolProfiler.stop(session, {})
  state.profilerStarted = false
  await ForceGarbageCollection.forceGarbageCollection(session)
  const trackedAllocations = await GetTrackedAllocations.getTrackedAllocations(session)
  await state.scriptHandler.stop(session)
  if (Object.keys(trackedAllocations).length === 0) {
    throw new Error(
      'Tracked allocation performance produced no data. The VS Code workbench was not instrumented, or no instrumented modules were loaded.',
    )
  }
  return {
    cpuProfile: profileResult?.profile || profileResult,
    scriptMap: state.scriptHandler.scriptMap,
    trackedAllocations,
  }
}

export const compare = CompareTrackedAllocationPerformance.compareTrackedAllocationPerformance

export const isLeak = () => {
  return false
}

export const summary = (result: TrackedAllocationPerformanceResult): string => {
  const lines = [
    'Tracked allocation performance (source-file CPU correlation):',
    `profileTotalTimeMs | ${result.metrics.profileTotalTimeMs}`,
    `javascriptSelfTimeMs | ${result.metrics.javascriptSelfTimeMs}`,
    `sampleCount | ${result.metrics.sampleCount}`,
  ]
  if (result.files.length > 0) {
    lines.push('source | created | collected | retained | sourceSelfTimeMs | sourceSelfTimePercent')
    for (const file of result.files.slice(0, 10)) {
      lines.push(
        `${file.source} | ${file.createdCount} | ${file.collectedCount} | ${file.retainedCount} | ${file.sourceSelfTimeMs} | ${file.sourceSelfTimePercent}`,
      )
    }
  }
  lines.push('CPU time is correlated by source file and is not allocation-attributed time.')
  return lines.join('\n')
}

export const releaseResources = async (session: Session, state: TrackedAllocationPerformanceState): Promise<void> => {
  if (state.profilerStarted) {
    try {
      await DevtoolsProtocolProfiler.stop(session, {})
    } catch {
      // Profiler may already be stopped.
    }
    state.profilerStarted = false
  }
  if (state.profilerEnabled) {
    try {
      await DevtoolsProtocolProfiler.disable(session, {})
    } catch {
      // Profiler may already be disabled.
    }
    state.profilerEnabled = false
  }
  try {
    await state.scriptHandler.stop(session)
  } catch {
    // Debugger may already be disabled.
  }
}
