import { setTimeout } from 'node:timers/promises'

const timeoutValue = {} as const

const createTimeoutPromise = async (milliseconds: number): Promise<any> => {
  await setTimeout(milliseconds)
  return timeoutValue
}

export const pTimeout = async (promise: Promise<any>, options: { readonly milliseconds: number }): Promise<any> => {
  const timeoutPromise = createTimeoutPromise(options.milliseconds)
  const result = await Promise.race([promise, timeoutPromise])
  if (result === timeoutValue) {
    throw new Error(`timeout of ${options.milliseconds}ms reached`)
  }
  return result
}
