import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.ts'
import { compareStrings2 } from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import type { Session } from '../Session/Session.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.StringDifference

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

export const compare = compareStrings2

export const isLeak = (newStrings: readonly string[]) => {
  return newStrings.length > 0
}
