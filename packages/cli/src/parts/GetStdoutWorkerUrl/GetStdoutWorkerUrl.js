import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const getStdoutWorkerUrl = () => {
  const url = join(Root.root, 'packages/stdout-worker/bin/stdout-worker.js')
  return url
}
