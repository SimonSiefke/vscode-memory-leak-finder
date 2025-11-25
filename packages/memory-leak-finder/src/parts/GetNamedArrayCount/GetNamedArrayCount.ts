import { join } from 'path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'
import * as Root from '../Root/Root.ts'

export const getNamedArrayCount = async (session: Session, objectGroup: string, id: number): Promise<any> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `array-count-${id}.json`)
  console.time('takeheapsnapshot')
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  console.timeEnd('takeheapsnapshot')
  console.time('loadheap')
  await HeapSnapshotFunctions.loadHeapSnapshot(outFile)
  console.timeEnd('loadheap')
  console.time('gecount')
  const arrayCountMap = await HeapSnapshotFunctions.getNamedArrayCountFromHeapSnapshot(outFile)
  console.timeEnd('gecount')
  await HeapSnapshotFunctions.disposeHeapSnapshot(outFile)
  return arrayCountMap
}
