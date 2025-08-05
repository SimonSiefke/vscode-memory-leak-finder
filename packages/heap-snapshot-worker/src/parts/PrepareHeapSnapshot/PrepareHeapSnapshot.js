import { Worker } from 'node:worker_threads'
import { getHeapSnapshotWorkerPath } from '../GetHeapSnapshotWorkerPath/GetHeapSnapshotWorkerPath.js'

/**
 * Prepares a heap snapshot by parsing it in a separate worker for better performance
 * @param {string} path - The file path to the heap snapshot
 * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array}>}
 */
export const prepareHeapSnapshot = async (path) => {
  const workerPath = getHeapSnapshotWorkerPath()
  const worker = new Worker(workerPath)

  try {
    // Create a promise that resolves with the message or rejects with exit error
    const result = await new Promise((resolve, reject) => {
      const messageHandler = (message) => {
        if (message.error) {
          reject(new Error(message.error))
        } else {
          resolve(message.result)
        }
        // Clean up listeners
        worker.off('message', messageHandler)
        worker.off('exit', exitHandler)
      }

      const exitHandler = (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`))
        } else {
          reject(new Error('Worker exited unexpectedly'))
        }
        // Clean up listeners
        worker.off('message', messageHandler)
        worker.off('exit', exitHandler)
      }

      // Set up event listeners
      worker.on('message', messageHandler)
      worker.on('exit', exitHandler)

      // Send the parsing command
      worker.postMessage({
        method: 'HeapSnapshot.parse',
        params: [path],
      })
    })

    return result
  } finally {
    // Always terminate the worker
    await worker.terminate()
  }
}
