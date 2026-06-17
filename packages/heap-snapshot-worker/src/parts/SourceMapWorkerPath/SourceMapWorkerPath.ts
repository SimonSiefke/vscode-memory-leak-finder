import { join } from 'node:path'
import { root } from '../Root/Root.ts'

export const getSourceMapCoordinatorPath = (): string => {
  const sourceMapWorkerPath: string = join(root, 'packages/source-map-coordinator/src/main.ts')
  return sourceMapWorkerPath
}
