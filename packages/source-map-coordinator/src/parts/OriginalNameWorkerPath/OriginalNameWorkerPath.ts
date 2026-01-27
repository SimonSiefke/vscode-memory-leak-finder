import { join } from 'node:path'
import { root } from '../Root/Root.ts'

export const getOriginalNameWorkerPath = (): string => {
  const workerPath: string = join(root, 'packages/original-name-worker/src/originalNameWorkerMain.ts')
  return workerPath
}
