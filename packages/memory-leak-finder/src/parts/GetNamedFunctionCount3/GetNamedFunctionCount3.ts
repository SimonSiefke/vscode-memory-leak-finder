import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as Root from '../Root/Root.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'

export const getNamedFunctionCount3 = async (
  session: Session,
  objectGroup: string,
  scriptMap: any,
  includeSourceMap: boolean,
  id: number,
): Promise<readonly any[]> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `${id}.json`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  await using rpc = await launchHeapSnapshotWorker()
  await HeapSnapshotFunctions.loadHeapSnapshot(rpc, outFile)
  const minCount = 1
  const functions = await HeapSnapshotFunctions.parseHeapSnapshotFunctions(rpc, outFile, scriptMap, minCount)
  await HeapSnapshotFunctions.disposeHeapSnapshot(rpc, outFile)
  return functions
}
