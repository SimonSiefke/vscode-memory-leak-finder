import { expect, test } from '@jest/globals'
import * as GetHandleTestSkippedMessage from '../src/parts/GetHandleTestSkippedMessage/GetHandleTestSkippedMessage.ts'

test('getHandleTestSkippedMessage - basic functionality', () => {
  const file = '/test/app.test.js'
  const relativeDirName = '/test'
  const fileName = 'app.test.js'
  const duration = 100

  const result = GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)

  expect(typeof result).toBe('string')
  expect(result).toContain('SKIP')
  expect(result).toContain('app.test.js')
  expect(result).toContain('/test/')
  expect(result).toContain('0.100 s')
  expect(result.endsWith('\n')).toBe(true)
})

test('getHandleTestSkippedMessage - different duration', () => {
  const file = '/test/component.test.js'
  const relativeDirName = '/test'
  const fileName = 'component.test.js'
  const duration = 1500

  const result = GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)

  expect(result).toContain('component.test.js')
  expect(result).toContain('1.500 s')
})

test('getHandleTestSkippedMessage - zero duration', () => {
  const file = '/test/util.test.js'
  const relativeDirName = '/test'
  const fileName = 'util.test.js'
  const duration = 0

  const result = GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)

  expect(result).toContain('util.test.js')
  expect(result).toContain('0.000 s')
})

test('getHandleTestSkippedMessage - nested directory path', () => {
  const file = '/test/components/button/button.test.js'
  const relativeDirName = '/test/components/button'
  const fileName = 'button.test.js'
  const duration = 250

  const result = GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)

  expect(result).toContain('button.test.js')
  expect(result).toContain('/test/components/button/')
  expect(result).toContain('0.250 s')
})

test('getHandleTestSkippedMessage - very long duration', () => {
  const file = '/test/slow.test.js'
  const relativeDirName = '/test'
  const fileName = 'slow.test.js'
  const duration = 10_000

  const result = GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)

  expect(result).toContain('slow.test.js')
  expect(result).toContain('10.000 s')
})

test('getHandleTestSkippedMessage - empty relative directory', () => {
  const file = 'root.test.js'
  const relativeDirName = ''
  const fileName = 'root.test.js'
  const duration = 50

  const result = GetHandleTestSkippedMessage.getHandleTestSkippedMessage(file, relativeDirName, fileName, duration)

  expect(result).toContain('root.test.js')
  expect(result).toContain('/')
  expect(result).toContain('0.050 s')
})
