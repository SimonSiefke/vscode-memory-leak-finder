import { Worker } from 'node:worker_threads'
import { getHeapSnapshotWorkerPath } from '../GetHeapSnapshotWorkerPath/GetHeapSnapshotWorkerPath.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { waitForResult } from '../WaitForResult/WaitForResult.ts'

export interface PrepareHeapSnapshotOptions {
  readonly parseStrings?: boolean
}

export const prepareHeapSnapshotFromJson = async (json: string, options: PrepareHeapSnapshotOptions): Promise<Snapshot> => {
  const workerPath = getHeapSnapshotWorkerPath()
  const worker = new Worker(workerPath)

  try {
    // Create the result promise (sets up event listeners)
    const resultPromise = waitForResult(worker)

    // Send the parsing command
    worker.postMessage({
      method: 'HeapSnapshot.parse',
      params: [json, options],
    })

    // Wait for the result
    return await resultPromise
  } finally {
    // Always terminate the worker
    await worker.terminate()
  }
}
