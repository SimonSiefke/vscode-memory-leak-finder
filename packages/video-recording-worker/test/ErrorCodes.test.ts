import { expect, test } from '@jest/globals'
import * as ErrorCodes from '../src/parts/ErrorCodes/ErrorCodes.ts'

test('ErrorCodes exports ENOENT', () => {
  expect(ErrorCodes.ENOENT).toBe('ENOENT')
})

test('ErrorCodes exports EXDEV', () => {
  expect(ErrorCodes.EXDEV).toBe('EXDEV')
})

test('ErrorCodes exports EEXIST', () => {
  expect(ErrorCodes.EEXIST).toBe('EEXIST')
})

test('ErrorCodes exports ENOTDIR', () => {
  expect(ErrorCodes.ENOTDIR).toBe('ENOTDIR')
})

test('ErrorCodes exports E_MANIFEST_NOT_FOUND', () => {
  expect(ErrorCodes.E_MANIFEST_NOT_FOUND).toBe('E_MANIFEST_NOT_FOUND')
})

test('ErrorCodes exports ESRCH', () => {
  expect(ErrorCodes.ESRCH).toBe('ESRCH')
})

test('ErrorCodes exports EIO', () => {
  expect(ErrorCodes.EIO).toBe('EIO')
})

test('ErrorCodes exports MODULE_NOT_FOUND', () => {
  expect(ErrorCodes.MODULE_NOT_FOUND).toBe('MODULE_NOT_FOUND')
})

test('ErrorCodes exports ERR_MODULE_NOT_FOUND', () => {
  expect(ErrorCodes.ERR_MODULE_NOT_FOUND).toBe('ERR_MODULE_NOT_FOUND')
})
