import { resolve } from 'node:path'
import { root } from '../Root/Root.ts'

export const getSourceMapWorkerPath = (): string => {
  const sourceMapWorkerPath: string = resolve(root, 'source-map-worker/src/sourceMapWorkerMain.ts')
  return sourceMapWorkerPath
}
