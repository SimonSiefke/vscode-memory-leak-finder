import { expect, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { waitForUtilityExecutionContext } from '../src/parts/WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'

const event = 'Runtime.executionContextCreated'
const context = { id: 2, uniqueId: 'main-utility', name: 'utility' }

test('ignores identically named contexts from other targets and releases the listener after matching', async () => {
  const rpc = Object.assign(new EventEmitter(), { sessionId: 'main' })
  const contexts = Object.create(null)
  let settled = false
  const pending = waitForUtilityExecutionContext(rpc, 'utility', contexts).then((value) => {
    settled = true
    return value
  })
  rpc.emit(event, { sessionId: 'auxiliary', params: { context } })
  await Promise.resolve()
  expect(settled).toBe(false)
  expect(Object.keys(contexts)).toEqual([])
  rpc.emit(event, { sessionId: 'main', params: { context } })
  await expect(pending).resolves.toEqual(context)
  expect(rpc.listenerCount(event)).toBe(0)
})

test('removes a pending listener when utility-context initialization is abandoned', () => {
  const rpc = Object.assign(new EventEmitter(), { sessionId: 'main' })
  const controller = new AbortController()
  void waitForUtilityExecutionContext(rpc, 'utility', Object.create(null), controller.signal)
  expect(rpc.listenerCount(event)).toBe(1)
  controller.abort()
  expect(rpc.listenerCount(event)).toBe(0)
})
