import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const getDownloadWorkerUrl = () => {
  const url = join(Root.root, 'packages/test-worker/bin/test-worker.js')
  return url
}
