<<<<<<< HEAD:packages/memory-leak-finder/src/parts/MeasureNamedArrayCount/MeasureNamedArrayCount.js
import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
=======
import * as CompareNamedArrayCountDifference from '../CompareNamedArrayCountDifference/CompareNamedArrayCountDifference.ts'
import * as GetNamedArrayCount from '../GetNamedArrayCount/GetNamedArrayCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
>>>>>>> origin/main:packages/memory-leak-finder/src/parts/MeasureNamedArrayCount/MeasureNamedArrayCount.ts

export const id = MeasureId.NamedArrayCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  const id = 0
  return getHeapSnapshot(session, id)
}

export const stop = async (session, objectGroup) => {
  const id = 1
  return getHeapSnapshot(session, id)
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = async (before, after) => {
  const [beforeMap, afterMap] = await Promise.all([
    HeapSnapshotFunctions.getNamedArrayCount(before),
    HeapSnapshotFunctions.getNamedArrayCount(after),
  ])
  return {
    before: beforeMap,
    after: afterMap,
  }
}

export const isLeak = (leaked) => {
  return leaked.length > 0
}
