import { afterEach, expect, jest, test } from '@jest/globals'
import { waitForWebSocketToBeOpen } from '../src/parts/WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'

const createSocket = () => {
  const socket = new EventTarget() as WebSocket
  Object.defineProperty(socket, 'readyState', { value: 0, configurable: true })
  socket.close = jest.fn()
  return socket
}

afterEach(() => {
  jest.useRealTimers()
})

test('stalled connection times out after five minutes and closes the socket', async () => {
  jest.useFakeTimers()
  const socket = createSocket()
  const result = waitForWebSocketToBeOpen(socket)
  const rejected = expect(result).rejects.toThrow('Timed out after 300000ms waiting for debugger WebSocket to open')
  await jest.advanceTimersByTimeAsync(300000)
  await rejected
  expect(socket.close).toHaveBeenCalledTimes(1)
  expect(jest.getTimerCount()).toBe(0)
})

test('slow connection succeeds and clears its timer', async () => {
  jest.useFakeTimers()
  const socket = createSocket()
  const result = waitForWebSocketToBeOpen(socket)
  await jest.advanceTimersByTimeAsync(299000)
  socket.dispatchEvent(new Event('open'))
  await result
  expect(socket.close).not.toHaveBeenCalled()
  expect(jest.getTimerCount()).toBe(0)
})

test.each(['close', 'error'])('rejects on %s before opening', async (event) => {
  jest.useFakeTimers()
  const socket = createSocket()
  const result = waitForWebSocketToBeOpen(socket)
  socket.dispatchEvent(new Event(event))
  await expect(result).rejects.toThrow('Debugger WebSocket')
  expect(jest.getTimerCount()).toBe(0)
})

test('already open socket resolves immediately', async () => {
  const socket = createSocket()
  Object.defineProperty(socket, 'readyState', { value: 1 })
  await waitForWebSocketToBeOpen(socket)
})
