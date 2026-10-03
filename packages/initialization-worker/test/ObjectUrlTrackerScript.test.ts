import { runInNewContext } from 'node:vm'
import { expect, test } from '@jest/globals'
import { objectUrlTrackerScript } from '../src/parts/ObjectUrlTrackerScript/ObjectUrlTrackerScript.ts'

test('tracks object URLs for the lifetime of a renderer document', () => {
  let nextId = 0
  const context: any = {
    URL: {
      createObjectURL: () => `blob:test-${++nextId}`,
      revokeObjectURL: () => {},
    },
  }

  runInNewContext(objectUrlTrackerScript, context)
  const revoked = context.URL.createObjectURL({})
  context.URL.createObjectURL({})
  context.URL.revokeObjectURL(revoked)

  expect(context.___memoryLeakFinderObjectUrlTracker.getCounts()).toEqual({
    created: 2,
    revoked: 1,
    unreleased: 1,
  })
})

test('does not reset an existing process-lifetime tracker', () => {
  const context: any = {
    URL: {
      createObjectURL: () => 'blob:test',
      revokeObjectURL: () => {},
    },
  }

  runInNewContext(objectUrlTrackerScript, context)
  context.URL.createObjectURL({})
  runInNewContext(objectUrlTrackerScript, context)

  expect(context.___memoryLeakFinderObjectUrlTracker.getCounts().created).toBe(1)
})
