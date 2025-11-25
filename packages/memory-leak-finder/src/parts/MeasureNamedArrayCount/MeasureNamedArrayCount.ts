import { compareNamedArrayCountDifference2 } from '../CompareNamedArrayCountDifference2/CompareNamedArrayCountDifference2.ts'
import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.NamedArrayCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  const id = 0
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  return heapSnapshotPath
}

export const stop = async (session, objectGroup) => {
  const id = 1
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  return heapSnapshotPath
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = compareNamedArrayCountDifference2

export const isLeak = (leaked) => {
  return leaked.length > 0
}
