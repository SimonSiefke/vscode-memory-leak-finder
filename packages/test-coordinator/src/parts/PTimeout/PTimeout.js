import { setTimeout } from 'node:timers/promises'

const rejectAfterTimeout = async (milliseconds) => {
  await setTimeout(milliseconds)
  throw new Error(`timeout of ${milliseconds}ms reached`)
}

export const pTimeout = async (promise, options) => {
  const timeoutPromise = rejectAfterTimeout(options.milliseconds)
  return Promise.race([promise, timeoutPromise])
}
