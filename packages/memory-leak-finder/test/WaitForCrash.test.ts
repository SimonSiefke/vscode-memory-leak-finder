import { expect, jest, test } from '@jest/globals'
import * as DevtoolsEventType from '../src/parts/DevtoolsEventType/DevtoolsEventType.ts'
import { waitForCrash } from '../src/parts/WaitForCrash/WaitForCrash.ts'

test('resolves only for the target being measured and unregisters its listener', async () => {
  let listener: ((event: any) => void) | undefined
  const on = jest.fn((_event: string, callback: (event: any) => void) => {
    listener = callback
  })
  const off = jest.fn()
  const wait = waitForCrash('target-1', { off, on })

  listener?.({ params: { targetId: 'target-2' } })
  let settled = false
  void wait.promise.then(() => {
    settled = true
  })
  await Promise.resolve()
  expect(settled).toBe(false)

  listener?.({ params: { targetId: 'target-1' } })
  await expect(wait.promise).resolves.toEqual({ crashed: true })
  wait.dispose()
  expect(on).toHaveBeenCalledWith(DevtoolsEventType.TargetTargetCrashed, expect.any(Function))
  expect(off).toHaveBeenCalledWith(DevtoolsEventType.TargetTargetCrashed, listener)
})

test('unregisters when measurement completes before a crash', async () => {
  const off = jest.fn()
  const listener = jest.fn()
  const wait = waitForCrash('target-1', { off, on: (_event: string, callback: () => void) => listener.mockImplementation(callback) })
  wait.dispose()
  await expect(wait.promise).resolves.toBeUndefined()
  expect(off).toHaveBeenCalledWith(DevtoolsEventType.TargetTargetCrashed, expect.any(Function))
})
