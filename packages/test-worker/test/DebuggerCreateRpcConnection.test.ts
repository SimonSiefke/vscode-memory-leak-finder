import { expect, jest, test } from '@jest/globals'
import { createRpc } from '../src/parts/DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'

const fixture = () => {
  const ipc: any = { send: jest.fn() }
  const rpc = createRpc(ipc, true)
  const notify = () => ipc.onmessage({ method: 'Target.attachedToTarget', params: { sessionId: 'auxiliary' } })
  return { rpc, notify }
}

test('delivers target events to concurrent attachment waiters and removes only the requested waiter', () => {
  const { rpc, notify } = fixture()
  const main = jest.fn()
  const auxiliary = jest.fn()
  rpc.on('Target.attachedToTarget', main)
  rpc.on('Target.attachedToTarget', auxiliary)
  notify()
  expect(main).toHaveBeenCalledTimes(1)
  expect(auxiliary).toHaveBeenCalledTimes(1)
  rpc.off('Target.attachedToTarget', main)
  notify()
  expect(main).toHaveBeenCalledTimes(1)
  expect(auxiliary).toHaveBeenCalledTimes(2)
  rpc.off('Target.attachedToTarget', auxiliary)
  expect(Object.keys(rpc.listeners)).toEqual([])
})

test('resolves concurrent once waiters without replacing persistent listeners', async () => {
  const { rpc, notify } = fixture()
  const listener = jest.fn()
  rpc.on('Target.attachedToTarget', listener)
  const first = rpc.once('Target.attachedToTarget')
  const second = rpc.once('Target.attachedToTarget')
  notify()
  const results = await Promise.all([first, second])
  expect(results[0]).toEqual(results[1])
  expect(Object.keys(rpc.onceListeners)).toEqual([])
  notify()
  expect(listener).toHaveBeenCalledTimes(2)
})
