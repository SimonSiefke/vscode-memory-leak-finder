import { Worker } from 'node:worker_threads'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getHeapSnapshotWorkerPath } from '../GetHeapSnapshotWorkerPath/GetHeapSnapshotWorkerPath.ts'
import { waitForResult } from '../WaitForResult/WaitForResult.ts'

const createDisposableWorker = (workerPath: string) => {
  const worker = new Worker(workerPath)
  return {
    async [Symbol.asyncDispose]() {
      await worker.terminate()
    },
    worker,
  }
}

interface PrepareHeapSnapshotOptions {
  readonly parseStrings?: boolean
}

export const prepareHeapSnapshot = async (path: string, options: PrepareHeapSnapshotOptions): Promise<Snapshot> => {
  const workerPath = getHeapSnapshotWorkerPath()
  await using worker = createDisposableWorker(workerPath)
  const resultPromise = waitForResult(worker.worker)
  worker.worker.postMessage({
    method: 'HeapSnapshot.parse',
    params: [path, options],
  })
  const result = (await resultPromise) as Snapshot
  return result
}
