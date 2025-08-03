import { Worker } from 'node:worker_threads'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

    const workerPath = join(__dirname, '../../../../heap-snapshot-parsing-worker/bin/heap-snapshot-parsing-worker.js')
    
    this.worker = new Worker(workerPath)
    
    this.worker.on('message', (message) => {
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
   * @returns {Promise<{metaData: any, nodes: Uint32Array, edges: Uint32Array, locations: Uint32Array}>}
   */
  async parseHeapSnapshot(path) {
    if (!this.worker) {
      throw new Error('Worker not started')
    }
    
    return new Promise((resolve, reject) => {
      const id = ++this.messageId
      this.callbacks.set(id, { resolve, reject })
      
      this.worker.postMessage({
        id,
        method: 'HeapSnapshotParsing.parse',
        params: [path],
      })
    })
  }

  /**
   * Terminates the parsing worker
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.callbacks.clear()
    }
  }
}