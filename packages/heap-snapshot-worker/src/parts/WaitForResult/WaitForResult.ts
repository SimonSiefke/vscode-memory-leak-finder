import { Worker } from 'node:worker_threads'

interface WorkerMessage {
  error?: string
  result?: any
}

/**
 * Waits for a result from the worker, either a message or exit event
 * @param worker - The worker to wait for
 * @returns The result from the worker
 */
export const waitForResult = (worker: Worker): Promise<any> => {
  const { promise, resolve, reject } = Promise.withResolvers<any>()

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
      resolve(message.result)
    }
  }

  const exitHandler = (code: number): void => {
    cleanup()
    if (code !== 0) {
      reject(new Error(`Worker stopped with exit code ${code}`))
    } else {
      reject(new Error('Worker exited unexpectedly'))
    }
  }

  // Set up event listeners
  worker.on('message', messageHandler)
  worker.on('exit', exitHandler)

  return promise
}
