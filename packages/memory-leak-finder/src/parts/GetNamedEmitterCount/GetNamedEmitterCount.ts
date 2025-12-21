import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as Root from '../Root/Root.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'

export const getNamedEmitterCount = async (session: Session, objectGroup: string, id: number): Promise<any> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `emitter-count-${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await using rpc = await launchHeapSnapshotWorker()
  await HeapSnapshotFunctions.loadHeapSnapshot(rpc, outFile)
  const counts = await HeapSnapshotFunctions.getNamedEmitterCountFromHeapSnapshot(rpc, outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(rpc, outFile)
  return counts
}
