import { join } from 'node:path'
import { root } from '../Root/Root.ts'

export const getSourceMapWorkerPath = (): string => {
  const sourceMapWorkerPath: string = join(root, 'packages/source-map-worker/src/sourceMapWorkerMain.ts')
  return sourceMapWorkerPath
}
