import { expect, jest, test } from '@jest/globals'
import { runInNewContext } from 'node:vm'
import { transformCode } from '../src/parts/Transform/Transform.js'

interface TimeoutCallback {
  (...args: any[]): any
}

const createTimeoutContext = () => {
  let nextId = 1
  const callbacks = new Map<number, { readonly args: readonly any[]; readonly callback: TimeoutCallback }>()
  const setTimeout = (callback: TimeoutCallback, _timeout?: number, ...args: readonly any[]): number => {
    const id = nextId++
    callbacks.set(id, { args, callback })
    return id
  }
  const clearTimeout = (id: number): void => {
    callbacks.delete(id)
  }
  const originalClearInterval = jest.fn()
  const context = {
    callbacks,
    clearInterval: originalClearInterval,
    clearTimeout,
    originalClearInterval,
    setTimeout,
  }
  return context
}

test('timeout tracking counts active timeouts from module evaluation', async () => {
  const context = createTimeoutContext()
  const transformed = await transformCode(
    `
      globalThis.firstTimeout = setTimeout(() => {}, 100)
      globalThis.secondTimeout = setTimeout(() => {}, 200)
    `,
    { trackingMode: 'timeouts' },
  )

  runInNewContext(transformed, context)

  expect((context as any).getTrackedTimeoutCount()).toBe(2)
})

test('timeout tracking removes fired and cleared timeouts exactly once', async () => {
  const context = createTimeoutContext()
  const transformed = await transformCode(
    `
      globalThis.firedTimeout = setTimeout((value) => {
        globalThis.callbackValue = value
      }, 100, 42)
      globalThis.clearedTimeout = setTimeout(() => {}, 200)
    `,
    { trackingMode: 'timeouts' },
  )

  runInNewContext(transformed, context)
  const firedTimeout = (context as any).firedTimeout
  const fired = context.callbacks.get(firedTimeout)!
  fired.callback(...fired.args)
  ;(context as any).clearTimeout(firedTimeout)
  ;(context as any).clearTimeout((context as any).clearedTimeout)

  expect((context as any).callbackValue).toBe(42)
  expect((context as any).getTrackedTimeoutCount()).toBe(0)
})

test('timeout tracking recognizes clearInterval for timeout ids', async () => {
  const context = createTimeoutContext()
  const transformed = await transformCode(`globalThis.timeout = setTimeout(() => {}, 100)`, { trackingMode: 'timeouts' })

  runInNewContext(transformed, context)
  ;(context as any).clearInterval((context as any).timeout)

  expect((context as any).getTrackedTimeoutCount()).toBe(0)
  expect(context.originalClearInterval).toHaveBeenCalledTimes(1)
})

test('timeout tracking is only installed once across transformed modules', async () => {
  const context = createTimeoutContext()
  const first = await transformCode(`globalThis.firstTimeout = setTimeout(() => {}, 100)`, { trackingMode: 'timeouts' })
  const second = await transformCode(`globalThis.secondTimeout = setTimeout(() => {}, 100)`, { trackingMode: 'timeouts' })

  runInNewContext(first, context)
  runInNewContext(second, context)

  expect((context as any).getTrackedTimeoutCount()).toBe(2)
})
