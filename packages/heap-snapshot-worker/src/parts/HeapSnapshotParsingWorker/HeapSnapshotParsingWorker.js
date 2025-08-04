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
      console.log(`[HeapSnapshotParsingWorker] Received message from worker at ${messageReceiveTime.toFixed(2)}ms`)

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
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`)
      }
    })
  }

  /**
   * Parses a heap snapshot file using the parsing worker
   * @param {string} path - The file path to the heap snapshot
   * @param {boolean} parseStrings - Whether to parse and return strings
   * @returns {Promise<{metaData: any, nodes: Uint32Array<ArrayBuffer>, edges: Uint32Array<ArrayBuffer>, locations: Uint32Array, strings: string[]}>}
   */
  async parseHeapSnapshot(path, parseStrings = false) {
    if (!this.worker) {
      throw new Error('Worker not started')
    }

    const startTime = performance.now()
    console.log(`[HeapSnapshotParsingWorker] Starting to parse: ${path} (parseStrings: ${parseStrings})`)

    const { promise, resolve, reject } = Promise.withResolvers()

    const id = ++this.messageId
    this.callbacks.set(id, {
      resolve: (result) => {
        const endTime = performance.now()
        const duration = endTime - startTime
        console.log(`[HeapSnapshotParsingWorker] Parse completed in ${duration.toFixed(2)}ms`)
        console.log(
          `[HeapSnapshotParsingWorker] Result sizes - nodes: ${result.nodes?.length || 0}, edges: ${result.edges?.length || 0}, locations: ${result.locations?.length || 0}, strings: ${result.strings?.length || 0}`,
        )
        resolve(result)
      },
      reject,
    })

    console.log(`[HeapSnapshotParsingWorker] Sending parse request to worker (id: ${id})`)
    const sendTime = performance.now()
    console.log(`[HeapSnapshotParsingWorker] Sending message at: ${sendTime.toFixed(2)}ms`)
    this.worker.postMessage({
      id,
      method: 'HeapSnapshot.parse',
      params: [path, parseStrings],
    })

    return promise
  }

  /**
   * Terminates the parsing worker
   */
  async [Symbol.asyncDispose]() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.callbacks.clear()
    }
  }
}
