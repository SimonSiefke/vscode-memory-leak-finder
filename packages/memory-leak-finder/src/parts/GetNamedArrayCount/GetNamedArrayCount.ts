import { join } from 'path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as Root from '../Root/Root.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'

export const getNamedArrayCount = async (session: Session, objectGroup: string, id: number): Promise<any> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `array-count-${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await using rpc = await launchHeapSnapshotWorker()
  await HeapSnapshotFunctions.loadHeapSnapshot(rpc, outFile)
  const arrayCountMap = await HeapSnapshotFunctions.getNamedArrayCountFromHeapSnapshot(rpc, outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(rpc, outFile)
  return arrayCountMap
}
