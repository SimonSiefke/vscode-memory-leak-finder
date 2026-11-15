import { expect, jest, test } from '@jest/globals'
import { createRpc } from '../src/parts/DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'

const connection = (requestTimeoutMs = 0) => {
  const ipc: any = { send: jest.fn(), dispose: jest.fn(), connectionClosed: false }
  return { ipc, rpc: createRpc(ipc, { requestTimeoutMs }) }
}

test('shared CDP connections reject outstanding commands on close and on disposal', async () => {
  for (const dispose of [true, false]) {
    const { ipc, rpc } = connection()
    const request = rpc.invoke('Runtime.evaluate', {})
    const rejected = expect(request).rejects.toThrow('connection closed')
    if (dispose) rpc.dispose()
    else {
      ipc.connectionClosed = true
      ipc.onclose()
    }
    await rejected
    expect(Object.keys(rpc.callbacks)).toEqual([])
    await expect(rpc.invoke('Runtime.evaluate', {})).rejects.toThrow('connection closed')
  }
})

test('bounded commands drop timed-out callbacks and safely ignore late replies', async () => {
  const { ipc, rpc } = connection(10)
  await expect(rpc.invoke('Profiler.stop', {})).rejects.toThrow('Profiler.stop timed out')
  expect(Object.keys(rpc.callbacks)).toEqual([])
  expect(() => ipc.onmessage({ id: 0, result: {} })).not.toThrow()
  rpc.dispose()
})

test('event cleanup removes only the registered listener and keeps other CDP events', () => {
  const { ipc, rpc } = connection()
  const first = jest.fn()
  const other = jest.fn()
  rpc.on('HeapProfiler.addHeapSnapshotChunk', first)
  rpc.on('Runtime.executionContextCreated', other)
  rpc.off('HeapProfiler.addHeapSnapshotChunk', other)
  ipc.onmessage({ method: 'HeapProfiler.addHeapSnapshotChunk', params: { chunk: 'a' } })
  expect(first).toHaveBeenCalledTimes(1)
  rpc.off('HeapProfiler.addHeapSnapshotChunk', first)
  ipc.onmessage({ method: 'HeapProfiler.addHeapSnapshotChunk', params: { chunk: 'b' } })
  ipc.onmessage({ method: 'Runtime.executionContextCreated', params: {} })
  expect(first).toHaveBeenCalledTimes(1)
  expect(other).toHaveBeenCalledTimes(1)
  rpc.dispose()
})

test('shared CDP multiplexing preserves sessions and settles synchronous send errors', async () => {
  const { ipc, rpc } = connection()
  const plain = rpc.invoke('Runtime.evaluate', { expression: '1' })
  const session = rpc.invokeWithSession('renderer', 'Performance.getMetrics', {})
  expect(ipc.send).toHaveBeenNthCalledWith(2, { id: 1, method: 'Performance.getMetrics', params: {}, sessionId: 'renderer' })
  ipc.onmessage({ id: 1, result: { metrics: [] } })
  ipc.onmessage({ id: 0, result: { value: 1 } })
  await expect(plain).resolves.toEqual({ id: 0, result: { value: 1 } })
  await expect(session).resolves.toEqual({ id: 1, result: { metrics: [] } })
  ipc.send.mockImplementation(() => {
    throw new Error('send failed')
  })
  await expect(rpc.invoke('Runtime.evaluate', {})).rejects.toThrow('send failed')
  expect(Object.keys(rpc.callbacks)).toEqual([])
  rpc.dispose()
})
