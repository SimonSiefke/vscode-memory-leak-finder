import { setTimeout } from 'node:timers/promises'

const timeoutValue = {}

const createTimeoutPromise = async (milliseconds: number) => {
  await setTimeout(milliseconds)
  return timeoutValue
}

export const pTimeout = async (promise: any, options: any): Promise<any> => {
  const timeoutPromise = createTimeoutPromise(options.milliseconds)
  const result = await Promise.race([promise, timeoutPromise])
  if (result === timeoutValue) {
    throw new Error(`timeout of ${options.milliseconds}ms reached`)
  }
  return result
}
