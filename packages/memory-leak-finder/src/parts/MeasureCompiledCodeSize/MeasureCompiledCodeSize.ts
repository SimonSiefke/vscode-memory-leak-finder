import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { ScriptMap } from '../Types/Types.ts'

interface CompiledCodeCapture {
  readonly heapSnapshotPath: string
  readonly scriptMap: ScriptMap
}

interface CompiledCodeState {
  readonly afterPath: string
  readonly beforePath: string
  readonly scriptHandler: IScriptHandler
  scriptHandlerStarted: boolean
}

export const id = MeasureId.CompiledCodeSize
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

const copyScriptMap = (scriptMap: ScriptMap): ScriptMap => {
  return Object.fromEntries(Object.entries(scriptMap).map(([key, value]) => [key, { ...value }]))
}

export const create = (session: Session) => {
  const captureId = randomUUID()
  const beforePath = join(Root.root, '.vscode-heapsnapshots', `compiled-code-size-${captureId}-before.json`)
  const afterPath = join(Root.root, '.vscode-heapsnapshots', `compiled-code-size-${captureId}-after.json`)
  process.once('exit', () => {
    rmSync(beforePath, { force: true })
    rmSync(afterPath, { force: true })
  })
  const state: CompiledCodeState = {
    afterPath,
    beforePath,
    scriptHandler: ScriptHandler.create(),
    scriptHandlerStarted: false,
  }
  return [session, state] as const
}

export const start = async (session: Session, state: CompiledCodeState): Promise<CompiledCodeCapture> => {
  await state.scriptHandler.start(session)
  state.scriptHandlerStarted = true
  await HeapSnapshot.takeHeapSnapshot(session, state.beforePath)
  return {
    heapSnapshotPath: state.beforePath,
    scriptMap: copyScriptMap(state.scriptHandler.scriptMap),
  }
}

export const stop = async (session: Session, state: CompiledCodeState): Promise<CompiledCodeCapture> => {
  try {
    await HeapSnapshot.takeHeapSnapshot(session, state.afterPath)
    return {
      heapSnapshotPath: state.afterPath,
      scriptMap: copyScriptMap(state.scriptHandler.scriptMap),
    }
  } finally {
    if (state.scriptHandlerStarted) {
      state.scriptHandlerStarted = false
      await state.scriptHandler.stop(session)
    }
  }
}

export const compare = async (
  before: CompiledCodeCapture,
  after: CompiledCodeCapture,
): Promise<unknown> => {
  try {
    await using rpc = await launchHeapSnapshotWorker()
    return await rpc.invoke('HeapSnapshot.compareCompiledCodeSize', before.heapSnapshotPath, after.heapSnapshotPath, {
      ...before.scriptMap,
      ...after.scriptMap,
    })
  } finally {
    await Promise.all([rm(before.heapSnapshotPath, { force: true }), rm(after.heapSnapshotPath, { force: true })])
  }
}

export const isLeak = (): false => false

export const releaseResources = async (session: Session, state: CompiledCodeState): Promise<void> => {
  if (!state.scriptHandlerStarted) {
    return
  }
  state.scriptHandlerStarted = false
  try {
    await state.scriptHandler.stop(session)
  } catch {
    // The inspected process may already be gone.
  }
}
