import { join } from 'node:path'
import { root } from '../Root/Root.ts'

/**
 * Gets the file path to the heap snapshot parsing worker executable
 * @returns {string} The absolute path to the heap snapshot parsing worker
 */
export const getHeapSnapshotWorkerPath = () => {
  return join(root, 'packages/heap-snapshot-parsing-worker/bin/heap-snapshot-parsing-worker.js')
}
