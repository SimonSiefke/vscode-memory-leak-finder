import { Worker } from 'node:worker_threads'
import { getHeapSnapshotWorkerPath } from '../GetHeapSnapshotWorkerPath/GetHeapSnapshotWorkerPath.js'

export class HeapSnapshotParsingWorker {
  constructor() {
    this.worker = null
    this.messageId = 0
    this.callbacks = new Map()
  }

  /**
   * Starts the parsing worker
   */
  async start() {
    if (this.worker) {
      return
    }

    const workerPath = getHeapSnapshotWorkerPath()

    this.worker = new Worker(workerPath)

    this.worker.on('message', (message) => {
      const messageReceiveTime = performance.now()

      if (message.id && this.callbacks.has(message.id)) {
        const { resolve, reject } = this.callbacks.get(message.id)
        this.callbacks.delete(message.id)

        if (message.error) {
          reject(new Error(message.error))
        } else {
          resolve(message.result)
        }
      }
    })

    this.worker.on('error', (error) => {
      console.error('Worker error:', error)
    })

    this.worker.on('exit', (code) => {
      // Only log if it's an unexpected exit (not during normal termination)
      if (code !== 0 && this.worker && code !== 1) {
        console.error(`Worker stopped with exit code ${code}`)
      }
    })
  }

  /**
   * Parses a heap snapshot file using the parsing worker
   * @param {string} path - The file path to the heap snapshot
   * @param {object} options - Options for parsing
   * @returns {Promise<{metaData: any, nodes: Uint32Array<ArrayBuffer>, edges: Uint32Array<ArrayBuffer>, locations: Uint32Array<ArrayBuffer>, strings: string[]}>}
   */
  async parseHeapSnapshot(path, options = {}) {
    if (!this.worker) {
      throw new Error('Worker not started')
    }

    const { promise, resolve, reject } = Promise.withResolvers()

    const id = ++this.messageId
    this.callbacks.set(id, {
      resolve: (result) => {
        resolve(result)
      },
      reject,
    })

    const sendTime = performance.now()
    this.worker.postMessage({
      id,
      method: 'HeapSnapshot.parse',
      params: [path, options],
    })

    return promise
  }

  /**
   * Terminates the parsing worker
   */
  async [Symbol.asyncDispose]() {
    if (this.worker) {
      const worker = this.worker
      this.worker = null
      this.callbacks.clear()
      await worker.terminate()
    }
  }
}
