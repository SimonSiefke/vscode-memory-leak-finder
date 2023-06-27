import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const getFileWatcherWorkerUrl = () => {
  const url = join(Root.root, 'packages/file-watcher-worker/bin/file-watcher-worker.js')
  return url
}
