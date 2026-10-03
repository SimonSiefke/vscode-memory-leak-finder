import { afterEach, expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { waitForData } from '../src/parts/WaitForData/WaitForData.ts'

afterEach(() => {
  jest.useRealTimers()
})

test('silent debugger output times out after five minutes and removes listeners', async () => {
  jest.useFakeTimers()
  const stream = new EventEmitter()
  const result = waitForData(stream, 'Debugger listening on', () => {})
  const rejected = expect(result).rejects.toThrow('Timed out after 300000ms waiting for Debugger listening on')
  await jest.advanceTimersByTimeAsync(300000)
  await rejected
  expect(stream.eventNames()).toEqual([])
  expect(jest.getTimerCount()).toBe(0)
})

test('slow startup succeeds and clears the deadline', async () => {
  jest.useFakeTimers()
  const stream = new EventEmitter()
  const result = waitForData(stream, 'Debugger listening on', () => {})
  await jest.advanceTimersByTimeAsync(299000)
  stream.emit('data', 'Debugger listening on ws://localhost')
  await expect(result).resolves.toBe('Debugger listening on ws://localhost')
  expect(stream.eventNames()).toEqual([])
  expect(jest.getTimerCount()).toBe(0)
})

test.each(['end', 'close'])('rejects when output emits %s', async (event) => {
  const stream = new EventEmitter()
  const result = waitForData(stream, 'Debugger listening on', () => {})
  stream.emit(event)
  await expect(result).rejects.toThrow('Output closed while waiting for Debugger listening on')
  expect(stream.eventNames()).toEqual([])
})

test('ignored output does not reset the deadline', async () => {
  jest.useFakeTimers()
  const stream = new EventEmitter()
  const result = waitForData(stream, 'DevTools listening on', () => {})
  const rejected = expect(result).rejects.toThrow('Timed out')
  await jest.advanceTimersByTimeAsync(200000)
  stream.emit('data', 'ignored warning')
  await jest.advanceTimersByTimeAsync(100000)
  await rejected
  expect(stream.eventNames()).toEqual([])
})

test('partial startup error shares the output deadline and cleans up its listener', async () => {
  jest.useFakeTimers()
  const { waitForDevtoolsListening } = await import('../src/parts/WaitForDevtoolsListening/WaitForDevtoolsListening.ts')
  const stream = new EventEmitter()
  const result = waitForDevtoolsListening(stream)
  const rejected = expect(result).rejects.toThrow('Timed out after 300000ms waiting for DevTools listening on')
  stream.emit('data', 'App threw an error during load')
  await jest.advanceTimersByTimeAsync(300000)
  await rejected
  expect(stream.eventNames()).toEqual([])
  expect(jest.getTimerCount()).toBe(0)
})
