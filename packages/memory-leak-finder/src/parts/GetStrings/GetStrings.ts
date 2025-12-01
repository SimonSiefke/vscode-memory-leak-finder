import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as Root from '../Root/Root.ts'

export const getStrings = async (session: Session, objectGroup: string, id: number): Promise<readonly string[]> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  const strings = await HeapSnapshotFunctions.parseHeapSnapshotStrings(outFile)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return strings
}
