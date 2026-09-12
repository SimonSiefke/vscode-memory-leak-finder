import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import type { Dynamic } from '../Types/Types.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface NativeContextCountState {
  readonly afterPath: string
  readonly beforePath: string
  captured: boolean
}

export const id = MeasureId.NativeContextCount
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const captureId = randomUUID()
  const beforePath = join(Root.root, '.vscode-heapsnapshots', `native-context-count-${captureId}-before.json`)
  const afterPath = join(Root.root, '.vscode-heapsnapshots', `native-context-count-${captureId}-after.json`)
  process.once('exit', () => {
    rmSync(beforePath, { force: true })
    rmSync(afterPath, { force: true })
  })
  return [session, { afterPath, beforePath, captured: false } satisfies NativeContextCountState] as const
}

export const start = async (session: Session, state: NativeContextCountState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.beforePath)
  return state.beforePath
}

export const stop = async (session: Session, state: NativeContextCountState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.afterPath)
  state.captured = true
  return state.afterPath
}

export const compare = async (beforePath: string, afterPath: string): Promise<Dynamic> => {
  try {
    await using rpc = await launchHeapSnapshotWorker()
    return await rpc.invoke('HeapSnapshot.compareNativeContextCount', beforePath, afterPath)
  } finally {
    await Promise.all([rm(beforePath, { force: true }), rm(afterPath, { force: true })])
  }
}

export const isLeak = (result: Dynamic): boolean => result?.isLeak === true

export const releaseResources = async (_session: Session, state: NativeContextCountState): Promise<void> => {
  if (!state.captured) {
    await Promise.all([rm(state.beforePath, { force: true }), rm(state.afterPath, { force: true })])
  }
}
