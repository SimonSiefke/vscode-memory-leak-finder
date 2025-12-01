import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as Root from '../Root/Root.ts'

export const getHeapSnapshot = async (session: Session, id: number): Promise<string> => {
  const outFile = join(Root.root, '.vscode-heapsnapshots', `${id}.json`)
  console.info('taking heapsnapshot')
  await HeapSnapshot.takeHeapSnapshot(session, outFile)
  console.log('took heapsnapshot')
  return outFile
}
