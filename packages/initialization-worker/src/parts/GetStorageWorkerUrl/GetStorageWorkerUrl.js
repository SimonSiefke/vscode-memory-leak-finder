import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const getStorageWorkerUrl = () => {
  const url = join(Root.root, 'packages/storage-worker/bin/storage-worker.js')
  return url
}
