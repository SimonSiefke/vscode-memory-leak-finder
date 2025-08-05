import { Worker } from 'node:worker_threads'

/**
 * Waits for a result from the worker, either a message or exit event
 * @param {Worker} worker - The worker to wait for
 * @returns {Promise<any>} - The result from the worker
 */
export const waitForResult = (worker) => {
  const { promise, resolve, reject } = Promise.withResolvers()

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

  return promise
}
