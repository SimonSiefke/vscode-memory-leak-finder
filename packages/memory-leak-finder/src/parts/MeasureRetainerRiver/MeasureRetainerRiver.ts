import { randomUUID } from 'node:crypto'
import { basename, join } from 'node:path'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import type { Dynamic, MeasureContext } from '../Types/Types.ts'
import { DevtoolsProtocolHeapProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ResolveRetainerRiverSourceMaps from '../ResolveRetainerRiverSourceMaps/ResolveRetainerRiverSourceMaps.ts'
import * as Root from '../Root/Root.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface RetainerRiverState {
  readonly directory: string
}

interface RetainerRiverAfter {
  readonly heapSnapshotPath: string
  readonly scriptMap: IScriptHandler['scriptMap']
}

export const id = MeasureId.RetainerRiver
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const state: RetainerRiverState = {
    directory: join(Root.root, '.vscode-heapsnapshots', 'retainer-river', randomUUID()),
  }
  return [session, state, ScriptHandler.create()]
}

export const start = async (session: Session, state: RetainerRiverState, scriptHandler: IScriptHandler): Promise<string> => {
  await scriptHandler.start(session)
  await DevtoolsProtocolHeapProfiler.enable(session)
  await DevtoolsProtocolHeapProfiler.startTrackingHeapObjects(session, {
    trackAllocations: true,
  })
  const heapSnapshotPath = join(state.directory, 'before.heapsnapshot')
  await HeapSnapshot.takeHeapSnapshot(session, heapSnapshotPath)
  return heapSnapshotPath
}

export const stop = async (session: Session, state: RetainerRiverState, scriptHandler: IScriptHandler): Promise<RetainerRiverAfter> => {
  await DevtoolsProtocolHeapProfiler.collectGarbage(session)
  const heapSnapshotPath = join(state.directory, 'after.heapsnapshot')
  await HeapSnapshot.takeHeapSnapshot(session, heapSnapshotPath, { stopTracking: true })
  await scriptHandler.stop(session)
  return {
    heapSnapshotPath,
    scriptMap: scriptHandler.scriptMap,
  }
}

const getMetadata = (context: MeasureContext, runs: number) => {
  const resultPath = typeof context.resultPath === 'string' ? context.resultPath : ''
  const testName = resultPath ? basename(resultPath).replace(/\.[^.]+$/, '') : 'retainer-river'
  return {
    processType: typeof context.processType === 'string' ? context.processType : 'inspected-target',
    runs,
    testName,
  }
}

export const compare = async (beforePath: string, after: RetainerRiverAfter, context: MeasureContext): Promise<Dynamic> => {
  const runs = typeof context.runs === 'number' && Number.isFinite(context.runs) ? Math.max(1, context.runs) : 1
  await using rpc = await launchHeapSnapshotWorker()
  const report: Dynamic = await rpc.invoke('HeapSnapshot.getRetainerRiver', beforePath, after.heapSnapshotPath, runs)
  const resolved = await ResolveRetainerRiverSourceMaps.resolveRetainerRiverSourceMaps(report, after.scriptMap)
  return {
    ...resolved,
    metadata: getMetadata(context, runs),
  }
}

export const releaseResources = async (session: Session): Promise<void> => {
  await DevtoolsProtocolHeapProfiler.disable(session, {})
}

export const isLeak = (report: Dynamic): boolean => {
  return report?.isLeak === true
}
