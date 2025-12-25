import { expect, test } from '@jest/globals'
import { extractParameterInfo } from '../src/generateApiTypes/ExtractParameterInfo.ts'

test('extractParameterInfo - empty string', () => {
  const result = extractParameterInfo('')
  expect(result).toEqual([])
})

test('extractParameterInfo - single parameter', () => {
  const result = extractParameterInfo('name')
  expect(result).toEqual([{ name: 'name', isOptional: false }])
})

test('extractParameterInfo - multiple parameters', () => {
  const result = extractParameterInfo('a, b, c')
  expect(result).toEqual([
    { name: 'a', isOptional: false },
    { name: 'b', isOptional: false },
    { name: 'c', isOptional: false },
  ])
})

test('extractParameterInfo - parameter with default value', () => {
  const result = extractParameterInfo('stayVisible = false')
  expect(result).toEqual([{ name: 'stayVisible', isOptional: true }])
})

test('extractParameterInfo - parameter with type and default', () => {
  const result = extractParameterInfo('text: string, stayVisible = false')
  expect(result).toEqual([
    { name: 'text', isOptional: false },
    { name: 'stayVisible', isOptional: true },
  ])
})

test('extractParameterInfo - destructured parameter', () => {
  const result = extractParameterInfo('{ serverName }')
  expect(result).toEqual([{ name: 'options', isOptional: false }])
})

test('extractParameterInfo - destructured parameter with default', () => {
  const result = extractParameterInfo('{ serverName } = {}')
  expect(result).toEqual([{ name: 'options', isOptional: true }])
})

test('extractParameterInfo - array destructuring', () => {
  const result = extractParameterInfo('[a, b]')
  expect(result).toEqual([{ name: 'options', isOptional: false }])
})

test('extractParameterInfo - mixed simple and complex', () => {
  const result = extractParameterInfo('text: string, { options }')
  expect(result).toEqual([
    { name: 'text', isOptional: false },
    { name: 'options', isOptional: false },
  ])
})
