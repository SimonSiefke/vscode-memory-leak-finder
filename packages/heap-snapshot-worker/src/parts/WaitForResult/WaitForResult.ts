import type { Worker } from 'node:worker_threads'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

interface WorkerMessage {
  readonly error?: string
  readonly result?: unknown
}

/**
 * Waits for a result from the worker, either a message or exit event
 * @param {Worker} worker - The worker to wait for
 * @returns {Promise<unknown>} - The result from the worker
 */
export const waitForResult = (worker: Worker): Promise<Snapshot> => {
  const { promise, reject, resolve } = Promise.withResolvers<Snapshot>()

  const cleanup = (): void => {
    // Clean up listeners
    worker.off('message', messageHandler)
    worker.off('exit', exitHandler)
  }

  const messageHandler = (message: WorkerMessage): void => {
    cleanup()
    if (message.error) {
      reject(new Error(message.error))
    } else {
      resolve(message.result as Snapshot)
    }
  }

  const exitHandler = (code: number) => {
    cleanup()
    if (code === 0) {
      reject(new Error('Worker exited unexpectedly'))
    } else {
      reject(new Error(`Worker stopped with exit code ${code}`))
    }
  }

  // Set up event listeners
  worker.on('message', messageHandler)
  worker.on('exit', exitHandler)

  return promise
}
