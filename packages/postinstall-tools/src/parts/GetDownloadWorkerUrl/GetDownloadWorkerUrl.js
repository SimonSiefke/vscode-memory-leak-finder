import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const getDownloadWorkerUrl = () => {
  const url = join(Root.root, 'packages/download-worker/bin/download-worker.js')
  return url
}
