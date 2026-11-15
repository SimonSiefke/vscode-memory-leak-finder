import { expect, test } from '@jest/globals'
import { getStackLabels } from '../src/parts/GetStackLabels/GetStackLabels.ts'

const group = (stack: string, location = 'owner.ts:1:1') => ({ string: stack, stack, location, count: 1 })

test('labels stacks by the first differing frame while retaining source positions', () => {
  const prefix = 'Error\n    at trackDisposable (file:///lifecycle.js:1:1)\n'
  const rows = [group(prefix + '    at focus (file:///widget.js:38:31)'), group(prefix + '    at blur (file:///widget.js:39:31)')]
  expect([...getStackLabels(rows).values()]).toEqual([
    'Stack: at focus (file:///widget.js:38:31)',
    'Stack: at blur (file:///widget.js:39:31)',
  ])
})

test('distinguishes stacks ending at the common prefix and supports escaped line breaks', () => {
  const prefix = 'Error\\n    at owner (file:///owner.js:1:1)'
  expect([...getStackLabels([group(prefix), group(prefix + '\\n    at caller (file:///caller.js:2:3)')]).values()]).toEqual([
    'Stack: at owner (file:///owner.js:1:1) (stack ends here)',
    'Stack: at caller (file:///caller.js:2:3)',
  ])
})

test('keeps unrelated retaining locations and ordinary string rows independent', () => {
  const stack = 'Error\n    at owner (file:///owner.js:1:1)'
  const labels = getStackLabels([group(stack), group(stack, 'other.ts:2:1'), { string: 'text', location: null, count: 1 }])
  expect(labels.size).toBe(2)
  expect([...labels.values()]).toEqual(['Stack: at owner (file:///owner.js:1:1)', 'Stack: at owner (file:///owner.js:1:1)'])
})

test('distinguishes different error messages sharing every frame', () => {
  const frame = '\n    at owner (file:///owner.js:1:1)'
  const labels = getStackLabels([group('Error: first' + frame), group('Error: second' + frame)])
  expect(new Set(labels.values()).size).toBe(2)
})
