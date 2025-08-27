import { expect, test } from '@jest/globals'
import * as Extract from '../src/parts/ExtractLineAndColumnFromStack/ExtractLineAndColumnFromStack.ts'

test('extractLineAndColumnFromStack - hit', () => {
  const stack: string = '    at Module.test (/repo/src/sample.test.js:15:29)\n    at other (file.js:1:2)'
  const relativeFilePath: string = 'src/sample.test.js'
  const pos = Extract.extractLineAndColumnFromStack(stack, relativeFilePath)
  expect(pos).toEqual({ line: 15, col: 29 })
})

test('extractLineAndColumnFromStack - miss', () => {
  const stack: string = '    at Module.test (/repo/src/other.js:10:5)'
  const relativeFilePath: string = 'src/sample.test.js'
  const pos = Extract.extractLineAndColumnFromStack(stack, relativeFilePath)
  expect(pos).toBeUndefined()
})


