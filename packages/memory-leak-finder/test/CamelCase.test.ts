import { test, expect } from '@jest/globals'
import * as CamelCase from '../src/parts/CamelCase/CamelCase.ts'

test('camelCase - converts dash-case to camelCase', () => {
  const result: string = CamelCase.camelCase('event-listener-count')
  expect(result).toBe('eventListenerCount')
})

test('camelCase - converts dash-case with numbers to camelCase', () => {
  const result: string = CamelCase.camelCase('canvas-rendering-context-2d-count')
  expect(result).toBe('canvasRenderingContext2dCount')
})

test('camelCase - converts webgl2-rendering-context-count where 2 is part of webgl2', () => {
  const result: string = CamelCase.camelCase('webgl2-rendering-context-count')
  expect(result).toBe('webgl2RenderingContextCount')
})

test('camelCase - converts webgl-2-rendering-context-count where 2 merges with webgl', () => {
  const result: string = CamelCase.camelCase('webgl-2-rendering-context-count')
  expect(result).toBe('webgl2RenderingContextCount')
})

test('camelCase - converts underscore-case to camelCase', () => {
  const result: string = CamelCase.camelCase('event_listener_count')
  expect(result).toBe('eventListenerCount')
})

test('camelCase - converts mixed dash and underscore to camelCase', () => {
  const result: string = CamelCase.camelCase('event-listener_count')
  expect(result).toBe('eventListenerCount')
})

test('camelCase - handles single word', () => {
  const result: string = CamelCase.camelCase('count')
  expect(result).toBe('count')
})

test('camelCase - handles empty string', () => {
  const result: string = CamelCase.camelCase('')
  expect(result).toBe('')
})
