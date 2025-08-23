import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const getSourceMapWorkerPath = (): string => {
  const thisDir: string = dirname(fileURLToPath(import.meta.url))
  const packageDir: string = resolve(thisDir, '../../..')
  const sourceMapWorkerPath: string = resolve(packageDir, '../source-map-worker/src/sourceMapWorkerMain.ts')
  return sourceMapWorkerPath
}
