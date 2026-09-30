import { expect, jest, test } from '@jest/globals'
import * as Capture from '../src/parts/PerformanceTraceCapture/PerformanceTraceCapture.ts'
import { selectEvents } from '../src/parts/PerformanceTraceEvents/PerformanceTraceEvents.ts'
test('cleans listeners after start conflict without ending another trace', async () => {
  const listeners = new Map(),
    calls: string[] = []
  const session: any = {
    on: (name: string, fn: Function) => listeners.set(name, fn),
    off: (name: string) => listeners.delete(name),
    invoke: async (name: string) => {
      calls.push(name)
      throw new Error('trace already active')
    },
  }
  const args = Capture.create(session)
  await expect(Capture.start(...args)).rejects.toThrow('trace already active')
  expect(listeners.size).toBe(0)
  expect(calls).toEqual(['Tracing.start'])
})
test('collects chunks and marks data loss on completion', async () => {
  const listeners = new Map(),
    calls: string[] = []
  const session: any = {
    on: (name: string, fn: Function) => listeners.set(name, fn),
    off: (name: string) => listeners.delete(name),
    invoke: async (name: string) => {
      calls.push(name)
      if (name === 'Tracing.end') {
        listeners.get('Tracing.dataCollected')({ params: { value: [{ name: 'test' }] } })
        listeners.get('Tracing.tracingComplete')({ params: { dataLossOccurred: true } })
      }
      return {}
    },
  }
  const args = Capture.create(session)
  await Capture.start(...args)
  const result = await Capture.stop(...args)
  expect(result.events).toHaveLength(1)
  expect(result.incomplete).toBe(true)
  expect(listeners.size).toBe(0)
  expect(calls.filter((name) => name === 'Tracing.end')).toHaveLength(1)
})
test('normalizes begin/end events and isolates renderer thread', () => {
  const event = (name: string, ts: number, ph: string, args = {}) => ({ name, ts, ph, args, pid: 1, tid: 2 })
  const result = selectEvents({
    marker: 'a',
    events: [
      event('TimeStamp', 0, 'I', { data: { message: 'a:start' } }),
      event('Layout', 1, 'B'),
      event('Layout', 3, 'E'),
      event('TimeStamp', 4, 'I', { data: { message: 'a:end' } }),
    ],
  })
  expect(result.events[0]).toMatchObject({ name: 'Layout', ts: 1, dur: 2 })
  expect(result.incomplete).toBe(false)
})

test('times out incomplete traces without sending end twice and releases listeners', async () => {
  jest.useFakeTimers()
  const listeners = new Map(),
    calls: string[] = []
  const session: any = {
    on: (name: string, fn: Function) => listeners.set(name, fn),
    off: (name: string) => listeners.delete(name),
    invoke: async (name: string) => {
      calls.push(name)
      return {}
    },
  }
  try {
    const args = Capture.create(session)
    await Capture.start(...args)
    const stopping = Capture.stop(...args)
    const assertion = expect(stopping).rejects.toThrow('Timed out waiting for trace completion')
    await jest.advanceTimersByTimeAsync(10001)
    await assertion
    expect(listeners.size).toBe(0)
    expect(calls.filter((name) => name === 'Tracing.end')).toHaveLength(1)
  } finally {
    jest.useRealTimers()
  }
})
