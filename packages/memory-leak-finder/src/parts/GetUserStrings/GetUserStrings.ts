import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as Root from '../Root/Root.ts'
/**
 *
 * @param {any} session
 * @returns {Promise<string[]>}
 */
export const getUserStrings = async (session: Session, objectGroup: string, id: string) => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await using rpc = await launchHeapSnapshotWorker()
  await HeapSnapshotFunctions.loadHeapSnapshot(rpc, outFile)
  const strings = await HeapSnapshotFunctions.parseHeapSnapshotUserStrings(rpc, outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(rpc, outFile)
  return strings
}
