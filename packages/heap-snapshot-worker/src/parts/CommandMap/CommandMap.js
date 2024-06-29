import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as ParseHeapSnapshotStrings from '../ParseHeapSnapshotStrings/ParseHeapSnapshotStrings.js'

export const commandMap = {
  'HeapSnapshot.parseStrings': ParseHeapSnapshotStrings.parseHeapSnapshotStrings,
  'HeapSnapshot.parseHeapSnapshot': ParseHeapSnapshot.parseHeapSnapshot,
}
