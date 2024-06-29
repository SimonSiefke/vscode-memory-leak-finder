import * as GetObjectShapeCountFromHeapSnapshot from '../GetObjectShapeCountFromHeapSnapshot/GetObjectShapeCountFromHeapSnapshot.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as ParseHeapSnapshotStrings from '../ParseHeapSnapshotStrings/ParseHeapSnapshotStrings.js'

export const commandMap = {
  'HeapSnapshot.parseStrings': ParseHeapSnapshotStrings.parseHeapSnapshotStrings,
  'HeapSnapshot.parseHeapSnapshot': ParseHeapSnapshot.parseHeapSnapshot,
  'HeapSnapshot.parseObjectShapeCount': GetObjectShapeCountFromHeapSnapshot.getObjectShapeCountFromHeapSnapshot,
}
