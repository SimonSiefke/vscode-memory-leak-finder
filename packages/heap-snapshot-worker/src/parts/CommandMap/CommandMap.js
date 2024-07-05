import * as GetLargestArraysFromHeapSnapshot from '../GetLargestArraysFromHeapSnapshot/GetLargestArraysFromHeapSnapshot.js'
import * as GetNamedArrayCountFromHeapSnapshot from '../GetNamedArrayCountFromHeapSnapshot/GetNamedArrayCountFromHeapSnapshot.js'
import * as GetNamedClosureCountFromHeapSnapshot from '../GetNamedClosureCountFromHeapSnapshot/GetNamedClosureCountFromHeapSnapshot.js'
import * as GetNamedEmitterCountFromHeapSnapshot from '../GetNamedEmitterCountFromHeapSnapshot/GetNamedEmitterCountFromHeapSnapshot.js'
import * as GetObjectShapeCountFromHeapSnapshot from '../GetObjectShapeCountFromHeapSnapshot/GetObjectShapeCountFromHeapSnapshot.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as ParseHeapSnapshotStrings from '../ParseHeapSnapshotStrings/ParseHeapSnapshotStrings.js'

export const commandMap = {
  'HeapSnapshot.parseStrings': ParseHeapSnapshotStrings.parseHeapSnapshotStrings,
  'HeapSnapshot.parseHeapSnapshot': ParseHeapSnapshot.parseHeapSnapshot,
  'HeapSnapshot.parseObjectShapeCount': GetObjectShapeCountFromHeapSnapshot.getObjectShapeCountFromHeapSnapshot,
  'HeapSnapshot.parseNamedArrayCount': GetNamedArrayCountFromHeapSnapshot.getNamedArrayCountFromHeapSnapshot,
  'HeapSnapshot.parseNamedEmitterCount': GetNamedEmitterCountFromHeapSnapshot.getNamedEmitterCountFromHeapSnapshot,
  'HeapSnapshot.getLargestArraysFromHeapSnapshot': GetLargestArraysFromHeapSnapshot.getLargestArraysFromHeapSnapshot,
  'HeapSnapshot.parseNamedClosureCount': GetNamedClosureCountFromHeapSnapshot.getNamedClosureCountFromHeapSnapshot,
}
