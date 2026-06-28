import { afterEach, expect, jest, test } from '@jest/globals'
import * as Timeout from '../src/parts/Timeout/Timeout.ts'

const originalMutationObserver = globalThis.MutationObserver

class FakeMutationObserver {
  static instances: FakeMutationObserver[] = []

  callback: MutationCallback
  disconnected = false
  disconnectCount = 0
  observeOptions: MutationObserverInit | undefined
  observeTarget: Node | undefined

  constructor(callback: MutationCallback) {
    this.callback = callback
    FakeMutationObserver.instances.push(this)
  }

  observe(target: Node, options?: MutationObserverInit): void {
    this.observeTarget = target
    this.observeOptions = options
  }

  disconnect(): void {
    this.disconnected = true
    this.disconnectCount++
  }

  trigger(): void {
    this.callback([], this as unknown as MutationObserver)
  }
}

afterEach(() => {
  jest.useRealTimers()
  FakeMutationObserver.instances = []
  globalThis.MutationObserver = originalMutationObserver
})

test('waitForMutation observes the passed target', async () => {
  jest.useFakeTimers()
  globalThis.MutationObserver = FakeMutationObserver as unknown as typeof MutationObserver
  const target = document.head

  const promise = Timeout.waitForMutation(target, 100)

  expect(FakeMutationObserver.instances[0].observeTarget).toBe(target)
  jest.advanceTimersByTime(100)
  await promise
})

test('waitForMutation disconnects when mutation wins', async () => {
  jest.useFakeTimers()
  globalThis.MutationObserver = FakeMutationObserver as unknown as typeof MutationObserver
  const promise = Timeout.waitForMutation(document.body, 100)
  const observer = FakeMutationObserver.instances[0]

  observer.trigger()

  expect(observer.disconnected).toBe(true)
  await promise
  expect(observer.disconnectCount).toBe(1)
  expect(jest.getTimerCount()).toBe(0)
})

test('waitForMutation disconnects when timeout wins', async () => {
  jest.useFakeTimers()
  globalThis.MutationObserver = FakeMutationObserver as unknown as typeof MutationObserver
  const promise = Timeout.waitForMutation(document.body, 100)
  const observer = FakeMutationObserver.instances[0]

  jest.advanceTimersByTime(100)
  await promise

  expect(observer.disconnected).toBe(true)
  expect(observer.disconnectCount).toBe(1)
  expect(jest.getTimerCount()).toBe(0)
})

test('waitForMutation clears timeout when observing fails', async () => {
  jest.useFakeTimers()
  class ThrowingMutationObserver extends FakeMutationObserver {
    override observe(): void {
      throw new Error('observe failed')
    }
  }
  globalThis.MutationObserver = ThrowingMutationObserver as unknown as typeof MutationObserver

  await expect(Timeout.waitForMutation(document.body, 100)).rejects.toThrow(new Error('observe failed'))
  expect(jest.getTimerCount()).toBe(0)
})
