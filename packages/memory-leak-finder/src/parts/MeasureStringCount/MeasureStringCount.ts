import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import type { Session } from '../Session/Session.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.StringCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  const id = 0
  return getHeapSnapshot(session, id)
}

export const stop = (session: Session, objectGroup: string) => {
  const id = 1
  return getHeapSnapshot(session, id)
}

const compareHeapSnapshotStringCount = async (before, after) => {
  await using rpc = await launchHeapSnapshotWorker()
  const [beforeCount, afterCount] = await Promise.all([
    HeapSnapshotFunctions.getStringCount(rpc, before),
    HeapSnapshotFunctions.getStringCount(rpc, after),
  ])
  return {
    after: afterCount,
    before: beforeCount,
  }
}

export const compare = compareHeapSnapshotStringCount

export const isLeak = IsLeakCount.isLeakCount
