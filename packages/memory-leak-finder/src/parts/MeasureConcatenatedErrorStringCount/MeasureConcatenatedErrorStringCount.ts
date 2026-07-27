import type { Session } from '../Session/Session.ts'
import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export interface ConcatenatedErrorStringCountComparison {
  readonly after: number
  readonly before: number
  readonly delta: number
  readonly totalAfter: number
  readonly totalBefore: number
  readonly totalDelta: number
}

export const id = MeasureId.ConcatenatedErrorStringCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return getHeapSnapshot(session, 0)
}

export const stop = (session: Session, objectGroup: string) => {
  return getHeapSnapshot(session, 1)
}

export const compare = async (beforePath: string, afterPath: string): Promise<ConcatenatedErrorStringCountComparison> => {
  await using rpc = await launchHeapSnapshotWorker()
  return HeapSnapshotFunctions.compareConcatenatedErrorStringCount(rpc, beforePath, afterPath)
}

export const isLeak = ({ after, before }: ConcatenatedErrorStringCountComparison): boolean => {
  return after > before
}
