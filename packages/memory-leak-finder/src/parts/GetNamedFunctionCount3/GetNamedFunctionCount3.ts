import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as Root from '../Root/Root.ts'

export const getNamedFunctionCount3 = async (
  session: Session,
  objectGroup: string,
  scriptMap: any,
  includeSourceMap: boolean,
  id: number,
): Promise<readonly any[]> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  const minCount = 1
  const functions = await HeapSnapshotFunctions.parseHeapSnapshotFunctions(outFile, scriptMap, minCount)
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return functions
}
