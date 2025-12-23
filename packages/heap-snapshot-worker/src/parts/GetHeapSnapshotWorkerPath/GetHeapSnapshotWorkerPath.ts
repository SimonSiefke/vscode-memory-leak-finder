import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Gets the file path to the heap snapshot parsing worker executable
 * @returns {string} The absolute path to the heap snapshot parsing worker
 */
export const getHeapSnapshotWorkerPath = () => {
  const __dirname = import.meta.dirname
  return join(__dirname, '../../../../heap-snapshot-parsing-worker/bin/heap-snapshot-parsing-worker.js')
}
