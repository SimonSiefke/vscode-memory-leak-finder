import { Worker } from 'node:worker_threads'
import { getHeapSnapshotWorkerPath } from '../GetHeapSnapshotWorkerPath/GetHeapSnapshotWorkerPath.ts'
import { waitForResult } from '../WaitForResult/WaitForResult.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

const createDisposableWorker = (workerPath: string) => {
  const worker = new Worker(workerPath)
  return {
    worker,
    [Symbol.dispose]() {
      worker.terminate()
    },
  }
}

/**
 * Prepares a heap snapshot by parsing it in a separate worker for better performance
 * @param {string} path - The file path to the heap snapshot
 * @param {{parseStrings?:boolean}} options - Options for parsing
 * @returns {Promise<import('../Snapshot/Snapshot.ts').Snapshot>}>}
 */
export const prepareHeapSnapshot = async (path: string, options: any): Promise<Snapshot> => {
  const workerPath = getHeapSnapshotWorkerPath()
  using worker = createDisposableWorker(workerPath)
  const resultPromise = waitForResult(worker.worker)
  worker.worker.postMessage({
    method: 'HeapSnapshot.parse',
    params: [path, options],
  })
  return await resultPromise
}
