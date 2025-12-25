import { expect, test } from '@jest/globals'
import { generateInterfaceFromMethods } from '../src/generateApiTypes/GenerateInterface.ts'
import type { MethodInfo, PropertyInfo } from '../src/generateApiTypes/types.ts'

test('generateInterfaceFromMethods - single method', () => {
  const methods: MethodInfo[] = [
    {
      name: 'method',
      parameters: [],
      returnType: 'Promise<void>',
      isAsync: true,
    },
  ]
  const properties: PropertyInfo[] = []
  const result = generateInterfaceFromMethods(methods, properties, 'TestInterface')
  expect(result).toContain('export interface TestInterface')
  expect(result).toContain('method(): Promise<void>')
})

test('generateInterfaceFromMethods - method with parameters', () => {
  const methods: MethodInfo[] = [
    {
      name: 'method',
      parameters: [
        { name: 'text', isOptional: false },
        { name: 'count', isOptional: true },
      ],
      returnType: 'Promise<void>',
      isAsync: true,
    },
  ]
  const properties: PropertyInfo[] = []
  const result = generateInterfaceFromMethods(methods, properties, 'TestInterface')
  expect(result).toContain('method(text: any, count?: any): Promise<void>')
})

test('generateInterfaceFromMethods - multiple methods', () => {
  const methods: MethodInfo[] = [
    {
      name: 'method1',
      parameters: [],
      returnType: 'Promise<void>',
      isAsync: true,
    },
    {
      name: 'method2',
      parameters: [],
      returnType: 'Promise<string>',
      isAsync: true,
    },
  ]
  const properties: PropertyInfo[] = []
  const result = generateInterfaceFromMethods(methods, properties, 'TestInterface')
  expect(result).toContain('method1(): Promise<void>')
  expect(result).toContain('method2(): Promise<string>')
})

test('generateInterfaceFromMethods - with properties', () => {
  const methods: MethodInfo[] = [
    {
      name: 'method',
      parameters: [],
      returnType: 'Promise<void>',
      isAsync: true,
    },
  ]
  const properties: PropertyInfo[] = [{ name: 'not', type: 'any' }]
  const result = generateInterfaceFromMethods(methods, properties, 'TestInterface')
  expect(result).toContain('method(): Promise<void>')
  expect(result).toContain('not: any')
})

test('generateInterfaceFromMethods - methods and properties together', () => {
  const methods: MethodInfo[] = [
    {
      name: 'method',
      parameters: [],
      returnType: 'Promise<void>',
      isAsync: true,
    },
  ]
  const properties: PropertyInfo[] = [
    { name: 'first', type: 'any' },
    { name: 'not', type: 'any' },
  ]
  const result = generateInterfaceFromMethods(methods, properties, 'TestInterface')
  expect(result).toContain('method(): Promise<void>')
  expect(result).toContain('first: any')
  expect(result).toContain('not: any')
})
