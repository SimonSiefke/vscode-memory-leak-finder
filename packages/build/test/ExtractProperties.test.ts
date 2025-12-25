import { expect, test } from '@jest/globals'
import { extractProperties } from '../src/generateApiTypes/ExtractProperties.ts'

test('extractProperties - no return statement', () => {
  const content = 'const obj = { }'
  const result = extractProperties(content)
  expect(result).toEqual([])
})

test('extractProperties - simple return object', () => {
  const content = `
    return {
      async method() { }
    }
  `
  const result = extractProperties(content)
  expect(result).toEqual([])
})

test('extractProperties - property with async methods', () => {
  const content = `
    return {
      not: {
        async toHaveItem() { }
      }
    }
  `
  const result = extractProperties(content)
  expect(result).toEqual([{ name: 'not', type: 'any' }])
})

test('extractProperties - multiple properties', () => {
  const content = `
    return {
      first: {
        async click() { }
      },
      not: {
        async toHaveItem() { }
      }
    }
  `
  const result = extractProperties(content)
  expect(result).toHaveLength(2)
  expect(result.map((p) => p.name)).toContain('first')
  expect(result.map((p) => p.name)).toContain('not')
})

test('extractProperties - property without async methods', () => {
  const content = `
    return {
      data: {
        value: 1
      }
    }
  `
  const result = extractProperties(content)
  expect(result).toEqual([])
})

test('extractProperties - nested return object', () => {
  const content = `
    function create() {
      return {
        not: {
          async method() { }
        }
      }
    }
  `
  const result = extractProperties(content)
  expect(result).toEqual([{ name: 'not', type: 'any' }])
})
