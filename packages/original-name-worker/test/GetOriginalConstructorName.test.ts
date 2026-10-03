import { expect, test } from '@jest/globals'
import * as GetOriginalConstructorName from '../src/parts/GetOriginalConstructorName/GetOriginalConstructorName.ts'

const getOriginalConstructorName = (sourceContent: string, originalLine: number, originalColumn: number): string => {
  return GetOriginalConstructorName.getOriginalConstructorName(sourceContent, originalLine, originalColumn, 'test.ts')
}

test('getOriginalConstructorName - constructor invocation', () => {
  const sourceContent = `function addDisposableListener() {
  return new DomListener(node, type, handler)
}`

  expect(getOriginalConstructorName(sourceContent, 1, 9)).toBe('DomListener')
})

test('getOriginalConstructorName - nested constructor invocation', () => {
  const sourceContent = `function allocate() {
  return new VSBuffer(new Uint8Array(byteLength))
}`

  expect(getOriginalConstructorName(sourceContent, 1, 9)).toBe('VSBuffer')
  expect(getOriginalConstructorName(sourceContent, 1, 22)).toBe('Uint8Array')
})

test('getOriginalConstructorName - member constructor invocation', () => {
  const sourceContent = `const value = new namespace.Widget()`

  expect(getOriginalConstructorName(sourceContent, 0, 14)).toBe('namespace.Widget')
})

test('getOriginalConstructorName - non-constructor allocation', () => {
  const sourceContent = `const values = [new Widget()]`

  expect(getOriginalConstructorName(sourceContent, 0, 15)).toBe('')
})
