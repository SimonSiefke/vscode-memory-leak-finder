import { Worker } from 'node:worker_threads'

/**
 * Waits for a result from the worker, either a message or exit event
 * @param {Worker} worker - The worker to wait for
 * @returns {Promise<any>} - The result from the worker
 */
export const waitForResult = (worker: Worker): Promise<any> => {
  const { promise, resolve, reject } = Promise.withResolvers<any>()

  const cleanup = () => {
    // Clean up listeners
    worker.off('message', messageHandler)
    worker.off('exit', exitHandler)
  }

  const messageHandler = (message: any) => {
    cleanup()
    if (message.error) {
      reject(new Error(message.error))
    } else {
      resolve(message.result)
    }
  }

  const exitHandler = (code: number) => {
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
