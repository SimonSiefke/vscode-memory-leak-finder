import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as Root from '../Root/Root.ts'

export const getDomTimerCount = async (session: Session, objectGroup: string, id: number): Promise<number> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `dom-timer-count-${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await using rpc = await launchHeapSnapshotWorker()
  await HeapSnapshotFunctions.loadHeapSnapshot(rpc, outFile)
  const count = await HeapSnapshotFunctions.getDomTimerCountFromHeapSnapshot(rpc, outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(rpc, outFile)
  return count
}
