import { Worker } from 'node:worker_threads'
import { waitForEvent } from '../WaitForEvent/WaitForEvent.js'

/**
 * Waits for a result from the worker, either a message or exit event
 * @param {Worker} worker - The worker to wait for
 * @returns {Promise<any>} - The result from the worker
 */
export const waitForResult = async (worker) => {
  const event = await waitForEvent(worker)
  if (event.error) {
    throw new Error(`${event.error}`)
  }
  return event.result
}
