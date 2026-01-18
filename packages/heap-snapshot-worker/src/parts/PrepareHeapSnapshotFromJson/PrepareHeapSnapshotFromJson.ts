import { Worker } from 'node:worker_threads'
import { getHeapSnapshotWorkerPath } from '../GetHeapSnapshotWorkerPath/GetHeapSnapshotWorkerPath.ts'
import { waitForResult } from '../WaitForResult/WaitForResult.ts'
import type { Snapshot, SnapshotMetaData } from '../Snapshot/Snapshot.ts'

interface PrepareHeapSnapshotOptions {
  readonly parseStrings?: boolean
}

interface PrepareHeapSnapshotFromJsonResult {
  readonly metaData: SnapshotMetaData
  readonly nodes: Uint32Array
  readonly edges: Uint32Array
  readonly locations: Uint32Array
  readonly strings: readonly string[]
}

/**
 * Prepares a heap snapshot by parsing it in a separate worker for better performance
 * @param {unknown} json - The JSON data to parse
 * @param {PrepareHeapSnapshotOptions} options - Options for parsing
 * @returns {Promise<PrepareHeapSnapshotFromJsonResult>}
 */
export const prepareHeapSnapshotFromJson = async (
  json: unknown,
  options: PrepareHeapSnapshotOptions,
): Promise<PrepareHeapSnapshotFromJsonResult> => {
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
    return (await resultPromise) as PrepareHeapSnapshotFromJsonResult
  } finally {
    // Always terminate the worker
    await worker.terminate()
  }
}
