import { join } from 'path'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as Root from '../Root/Root.ts'
import type { Session } from '../Session/Session.ts'

export const getLargestArrayCount = async (session: Session, objectGroup: string, id: number): Promise<any> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `largest-array-count-${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await using rpc = await launchHeapSnapshotWorker()
  await HeapSnapshotFunctions.loadHeapSnapshot(rpc, outFile)
  const arrays = await HeapSnapshotFunctions.getLargestArraysFromHeapSnapshot(rpc, outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(rpc, outFile)
  return arrays
}
