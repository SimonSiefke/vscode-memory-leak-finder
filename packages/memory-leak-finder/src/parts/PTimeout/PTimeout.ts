import type { Dynamic } from '../Types/Types.ts'
import { setTimeout } from 'node:timers/promises'
const timeoutValue = {} as const
const createTimeoutPromise = async (milliseconds: number): Promise<Dynamic> => {
  await setTimeout(milliseconds)
  return timeoutValue
}
export const pTimeout = async (
  promise: Promise<Dynamic>,
  options: {
    readonly milliseconds: number
  },
): Promise<Dynamic> => {
  const timeoutPromise = createTimeoutPromise(options.milliseconds)
  const result = await Promise.race([promise, timeoutPromise])
  if (result === timeoutValue) {
    throw new Error(`timeout of ${options.milliseconds}ms reached`)
  }
  return result
}
