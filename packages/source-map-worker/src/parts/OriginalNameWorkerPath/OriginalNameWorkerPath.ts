import { resolve } from 'node:path'

export const getOriginalNameWorkerPath = (): string => {
  const thisDir: string = import.meta.dirname
  const packageDir: string = resolve(thisDir, '../../..')
  const workerPath: string = resolve(packageDir, '../original-name-worker/src/originalNameWorkerMain.ts')
  return workerPath
}
