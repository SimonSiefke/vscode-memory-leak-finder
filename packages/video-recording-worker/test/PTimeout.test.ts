import { expect, test } from '@jest/globals'
import * as PTimeout from '../src/parts/PTimeout/PTimeout.ts'

test('pTimeout should resolve when promise resolves before timeout', async () => {
  const fastPromise = Promise.resolve('success')
  const result = await PTimeout.pTimeout(fastPromise, { milliseconds: 100 })
  expect(result).toBe('success')
})

test('pTimeout should throw when timeout is reached', async () => {
  const { resolve, promise } = Promise.withResolvers<void>()
  setTimeout(resolve, 1000)
  await expect(PTimeout.pTimeout(promise, { milliseconds: 100 })).rejects.toThrow('timeout of 100ms reached')
})

test('pTimeout should handle rejected promises', async () => {
  const rejectedPromise = Promise.reject(new Error('promise error'))
  await expect(PTimeout.pTimeout(rejectedPromise, { milliseconds: 100 })).rejects.toThrow('promise error')
})
