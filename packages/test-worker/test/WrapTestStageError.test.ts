import { expect, test } from '@jest/globals'
import * as WrapTestStageError from '../src/parts/WrapTestStageError/WrapTestStageError.ts'

test('wrapTestStageError adds the stage and file to the error message', () => {
  const error = new Error('boom')

  const wrapped = WrapTestStageError.wrapTestStageError(error, 'run', '/tmp/editor-format.ts')

  expect(wrapped.message).toBe('Failed to run test /tmp/editor-format.ts: boom')
})
