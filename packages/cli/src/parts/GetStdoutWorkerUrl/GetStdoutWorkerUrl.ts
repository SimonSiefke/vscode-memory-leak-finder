import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getStdoutWorkerUrl = (): string => {
  const url = join(Root.root, 'packages/stdout-worker/bin/stdout-worker.js')
  return url
}
