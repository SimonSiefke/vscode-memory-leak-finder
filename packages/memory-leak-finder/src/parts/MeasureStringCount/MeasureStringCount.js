import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.StringCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  const id = 0
  return getHeapSnapshot(session, id)
}

export const stop = (session, objectGroup) => {
  const id = 1
  return getHeapSnapshot(session, id)
}

const compareHeapSnapshotStringCount = async (before, after) => {
  const [beforeCount, afterCount] = await Promise.all([
    HeapSnapshotFunctions.getStringCount(before),
    HeapSnapshotFunctions.getStringCount(after),
  ])
  return {
    before: beforeCount,
    after: afterCount,
  }
}

export const compare = compareHeapSnapshotStringCount

export const isLeak = IsLeakCount.isLeakCount
