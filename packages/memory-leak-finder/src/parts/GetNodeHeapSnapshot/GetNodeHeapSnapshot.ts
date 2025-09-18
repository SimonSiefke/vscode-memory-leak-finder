import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as Root from '../Root/Root.ts'

export const getNodeHeapSnapshot = async (
  session: Session,
  nodeProcessId: string,
  snapshotId: string,
): Promise<string> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `node-${nodeProcessId}-${snapshotId}.json`)
  console.info(`taking heapsnapshot for node process ${nodeProcessId}`)
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  return outFile
}
