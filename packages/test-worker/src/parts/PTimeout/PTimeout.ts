import { setTimeout } from 'node:timers/promises'
import * as Assert from '../Assert/Assert.ts'

const timeoutValue = {}

const createTimeoutPromise = async (milliseconds) => {
  await setTimeout(milliseconds)
  return timeoutValue
}

export const pTimeout = async (promise, options) => {
  Assert.number(options.milliseconds)
  const timeoutPromise = createTimeoutPromise(options.milliseconds)
  const result = await Promise.race([promise, timeoutPromise])
  if (result === timeoutValue) {
    throw new Error(`timeout of ${options.milliseconds}ms reached`)
  }
  return result
}
