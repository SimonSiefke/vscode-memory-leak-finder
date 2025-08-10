import { expect, test } from '@jest/globals'
import * as TargetState from '../src/parts/TargetState/TargetState.ts'

test('TargetState has initial empty state', () => {
  TargetState.reset()
  expect(Object.keys(TargetState.state.targets).length).toBe(0)
  expect(TargetState.state.callbacks.length).toBe(0)
  expect(TargetState.state.destroyedCallbacks.length).toBe(0)
})

test('reset clears state', () => {
  // Add some data first
  TargetState.addTarget('test-target', { type: 'page', url: 'https://example.com' })
  TargetState.state.callbacks.push({ test: 'callback' })

  expect(Object.keys(TargetState.state.targets).length).toBe(1)
  expect(TargetState.state.callbacks.length).toBe(1)

  // Reset should clear everything
  TargetState.reset()

  expect(Object.keys(TargetState.state.targets).length).toBe(0)
  expect(TargetState.state.callbacks.length).toBe(0)
})

test('addTarget adds target to state', () => {
  TargetState.reset()

  const targetId = 'test-target-123'
  const target = {
    type: 'page',
    url: 'https://example.com',
    sessionId: 'session-123',
  }

  TargetState.addTarget(targetId, target)

  expect(TargetState.state.targets[targetId]).toBe(target)
  expect(Object.keys(TargetState.state.targets).length).toBe(1)
})

test('addTarget throws error for non-string targetId', () => {
  expect(() => TargetState.addTarget(123, {})).toThrow()
  expect(() => TargetState.addTarget(null, {})).toThrow()
  expect(() => TargetState.addTarget(undefined, {})).toThrow()
})

test('addTarget throws error for non-object target', () => {
  expect(() => TargetState.addTarget('target-id', 'not-an-object')).toThrow()
  expect(() => TargetState.addTarget('target-id', 123)).toThrow()
  expect(() => TargetState.addTarget('target-id', null)).toThrow()
})

test('removeTarget removes target from state', () => {
  TargetState.reset()

  const targetId = 'test-target-123'
  const target = { type: 'page', url: 'https://example.com' }

  TargetState.addTarget(targetId, target)
  expect(TargetState.state.targets[targetId]).toBe(target)

  TargetState.removeTarget(targetId)
  expect(TargetState.state.targets[targetId]).toBeUndefined()
})

test('removeTarget throws error for non-string targetId', () => {
  expect(() => TargetState.removeTarget(123)).toThrow()
  expect(() => TargetState.removeTarget(null)).toThrow()
  expect(() => TargetState.removeTarget(undefined)).toThrow()
})

test('removeTarget resolves destroyed callbacks for matching targetId', () => {
  TargetState.reset()

  const targetId = 'test-target-123'
  const target = { type: 'page', url: 'https://example.com' }

  TargetState.addTarget(targetId, target)

  // Add destroyed callback
  let callbackResolved = false
  TargetState.state.destroyedCallbacks.push({
    targetId,
    resolve: () => {
      callbackResolved = true
    },
  })

  // Add another callback for different target (should not be resolved)
  let otherCallbackResolved = false
  TargetState.state.destroyedCallbacks.push({
    targetId: 'other-target',
    resolve: () => {
      otherCallbackResolved = true
    },
  })

  expect(TargetState.state.destroyedCallbacks.length).toBe(2)

  TargetState.removeTarget(targetId)

  expect(callbackResolved).toBe(true)
  expect(otherCallbackResolved).toBe(false)
  expect(TargetState.state.destroyedCallbacks.length).toBe(1)
})

test('addTarget resolves waiting callbacks when matching target is added', () => {
  TargetState.reset()

  let callbackResolved = false
  let resolvedTarget = null

  // Add callback waiting for 'page' type at index 0
  TargetState.state.callbacks.push({
    type: 'page',
    index: 0,
    resolve: (target) => {
      callbackResolved = true
      resolvedTarget = target
    },
  })

  const target = { type: 'page', url: 'https://example.com' }
  TargetState.addTarget('test-target', target)

  expect(callbackResolved).toBe(true)
  expect(resolvedTarget).toBe(target)
})

test('addTarget resolves callback for correct index', () => {
  TargetState.reset()

  // Add first target
  TargetState.addTarget('target-1', { type: 'page', url: 'https://example1.com' })

  let callbackResolved = false
  let resolvedTarget = null

  // Add callback waiting for second 'page' type (index 1)
  TargetState.state.callbacks.push({
    type: 'page',
    index: 1,
    resolve: (target) => {
      callbackResolved = true
      resolvedTarget = target
    },
  })

  // Add second target - this should resolve the callback
  const secondTarget = { type: 'page', url: 'https://example2.com' }
  TargetState.addTarget('target-2', secondTarget)

  expect(callbackResolved).toBe(true)
  expect(resolvedTarget).toBe(secondTarget)
})

test('waitForTargetToBeClosed throws error for non-string targetId', async () => {
  await expect(TargetState.waitForTargetToBeClosed(123)).rejects.toThrow()
  await expect(TargetState.waitForTargetToBeClosed(null)).rejects.toThrow()
  await expect(TargetState.waitForTargetToBeClosed(undefined)).rejects.toThrow()
})

test('waitForTargetToBeClosed returns immediately if target does not exist', async () => {
  TargetState.reset()

  const result = await TargetState.waitForTargetToBeClosed('non-existent-target')
  expect(result).toBeUndefined()
})

test('waitForTarget returns existing target immediately if found', async () => {
  TargetState.reset()

  const target = { type: 'page', url: 'https://example.com' }
  TargetState.addTarget('target-1', target)

  const result = await TargetState.waitForTarget({ type: 'page', index: 0 })
  expect(result).toBe(target)
})

test('waitForTarget returns correct target by index', async () => {
  TargetState.reset()

  const target1 = { type: 'page', url: 'https://example1.com' }
  const target2 = { type: 'page', url: 'https://example2.com' }

  TargetState.addTarget('target-1', target1)
  TargetState.addTarget('target-2', target2)

  const result0 = await TargetState.waitForTarget({ type: 'page', index: 0 })
  expect(result0).toBe(target1)

  const result1 = await TargetState.waitForTarget({ type: 'page', index: 1 })
  expect(result1).toBe(target2)
})
