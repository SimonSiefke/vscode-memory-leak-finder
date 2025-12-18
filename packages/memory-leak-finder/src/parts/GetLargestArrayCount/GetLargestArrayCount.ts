import { join } from 'path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as Root from '../Root/Root.ts'

export const getLargestArrayCount = async (session: Session, objectGroup: string, id: number): Promise<any> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `largest-array-count-${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  const arrays = await HeapSnapshotFunctions.getLargestArraysFromHeapSnapshot(outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return arrays
}
