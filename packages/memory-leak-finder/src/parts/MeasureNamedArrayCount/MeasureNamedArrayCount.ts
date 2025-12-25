import type { Session } from '../Session/Session.ts'
import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.NamedArrayCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session: Session, objectGroup: string) => {
  const id = 0
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  return heapSnapshotPath
}

export const stop = async (session: Session, objectGroup: string) => {
  const id = 1
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  return heapSnapshotPath
}

export const releaseResources = async (session: Session, objectGroup: string) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const isLeak = (leaked) => {
  return leaked.length > 0
}

export { compareNamedArrayCountDifference2 as compare } from '../CompareNamedArrayCountDifference2/CompareNamedArrayCountDifference2.ts'
