import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getExecWorkerUrl = (): string => {
  const url = join(Root.root, 'packages', 'exec-worker', 'bin', 'exec-worker.js')
  return url
}
