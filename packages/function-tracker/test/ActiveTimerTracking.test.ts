import { expect, test } from '@jest/globals'
import { createContext, runInContext } from 'node:vm'
import { transformCode } from '../src/parts/Transform/Transform.ts'

const createTimers = () => {
  let nextId = 1
  const timers = new Map<number, { callback: (...args: any[]) => unknown; args: any[]; repeat: boolean }>()
  const context = createContext({
    setTimeout(callback: (...args: any[]) => unknown, _delay: number, ...args: any[]) {
      const id = nextId++
      timers.set(id, { callback, args, repeat: false })
      return id
    },
    setInterval(callback: (...args: any[]) => unknown, _delay: number, ...args: any[]) {
      const id = nextId++
      timers.set(id, { callback, args, repeat: true })
      return id
    },
    clearTimeout(id: number) {
      timers.delete(id)
    },
    clearInterval(id: number) {
      timers.delete(id)
    },
  })
  const fire = (id: number) => {
    const timer = timers.get(id)!
    if (!timer.repeat) timers.delete(id)
    return Reflect.apply(timer.callback, context, timer.args)
  }
  return { context, fire }
}

test('tracks startup timers separately, removes fired timeouts, and keeps repeating intervals active', async () => {
  const { context, fire } = createTimers()
  runInContext(
    await transformCode(
      `
    globalThis.timeout = setTimeout(function(value) { globalThis.result = value; globalThis.receiver = this }, 1, 42)
    globalThis.interval = setInterval(() => {}, 1)
  `,
      { trackingMode: 'active-timers' },
    ),
    context,
  )
  expect(context.___memoryLeakFinderGetActiveTimerCounts()).toEqual({ timeouts: 1, intervals: 1 })
  fire(context.timeout)
  fire(context.interval)
  fire(context.interval)
  expect(context.result).toBe(42)
  expect(context.receiver).toBe(context)
  expect(context.___memoryLeakFinderGetActiveTimerCounts()).toEqual({ timeouts: 0, intervals: 1 })
})

test('supports interchangeable clear APIs, numeric string handles and repeated clears', async () => {
  const { context } = createTimers()
  runInContext(
    await transformCode(
      `
    const timeout = setTimeout(() => {}, 1)
    const interval = setInterval(() => {}, 1)
    clearInterval(String(timeout))
    clearTimeout(interval)
    clearTimeout(interval)
  `,
      { trackingMode: 'active-timers' },
    ),
    context,
  )
  expect(context.___memoryLeakFinderGetActiveTimerCounts()).toEqual({ timeouts: 0, intervals: 0 })
})

test('counts throwing and string timeout callbacks as completed and does not reset between modules', async () => {
  const { context, fire } = createTimers()
  runInContext(
    await transformCode(
      `
    globalThis.throwing = setTimeout(() => { throw new Error('callback failed') }, 1)
    globalThis.string = setTimeout('var stringTimerRan = true', 1)
  `,
      { trackingMode: 'active-timers' },
    ),
    context,
  )
  runInContext(await transformCode('', { trackingMode: 'active-timers' }), context)
  expect(context.___memoryLeakFinderGetActiveTimerCounts().timeouts).toBe(2)
  expect(() => fire(context.throwing)).toThrow('callback failed')
  fire(context.string)
  expect(context.stringTimerRan).toBe(true)
  expect(context.___memoryLeakFinderGetActiveTimerCounts()).toEqual({ timeouts: 0, intervals: 0 })
})
