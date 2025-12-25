import { expect, test } from '@jest/globals'
import { extractMethodInfo } from '../src/generateApiTypes/ExtractMethodInfo.ts'

test('extractMethodInfo - single method', () => {
  const content = `
    async method() {
      return
    }
  `
  const result = extractMethodInfo(content)
  expect(result).toHaveLength(1)
  expect(result[0]).toMatchObject({
    name: 'method',
    isAsync: true,
    returnType: 'Promise<void>',
  })
})

test('extractMethodInfo - method with parameters', () => {
  const content = `
    async method(text: string, count: number) {
      return
    }
  `
  const result = extractMethodInfo(content)
  expect(result).toHaveLength(1)
  expect(result[0].parameters).toEqual([
    { name: 'text', isOptional: false },
    { name: 'count', isOptional: false },
  ])
})

test('extractMethodInfo - method with optional parameter', () => {
  const content = `
    async method(text: string, stayVisible = false) {
      return
    }
  `
  const result = extractMethodInfo(content)
  expect(result).toHaveLength(1)
  expect(result[0].parameters).toEqual([
    { name: 'text', isOptional: false },
    { name: 'stayVisible', isOptional: true },
  ])
})

test('extractMethodInfo - method with return type', () => {
  const content = `
    async method(): Promise<string> {
      return 'hello'
    }
  `
  const result = extractMethodInfo(content)
  expect(result).toHaveLength(1)
  expect(result[0].returnType).toBe('Promise<string>')
})

test('extractMethodInfo - multiple methods', () => {
  const content = `
    async method1() { }
    async method2() { }
    async method3() { }
  `
  const result = extractMethodInfo(content)
  expect(result).toHaveLength(3)
  expect(result.map(m => m.name)).toEqual(['method1', 'method2', 'method3'])
})

test('extractMethodInfo - qualified return type simplified', () => {
  const content = `
    async method(): Promise<Server.ServerInfo> {
      return server
    }
  `
  const result = extractMethodInfo(content)
  expect(result).toHaveLength(1)
  expect(result[0].returnType).toBe('Promise<any>')
})
