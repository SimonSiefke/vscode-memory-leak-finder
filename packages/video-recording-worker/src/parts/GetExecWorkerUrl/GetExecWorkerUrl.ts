import { join } from 'node:path'
import { root } from '../Root/Root.ts'

export const getExecWorkerUrl = (): string => {
  const url = join(root, 'packages', 'exec-worker', 'bin', 'exec-worker.js')
  return url
}
