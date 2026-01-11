import * as IsIgnoredConstructorScopeEdge from '../src/parts/IsIgnoredConstructorScopeEdge/IsIgnoredConstructorScopeEdge.js'
import { test, expect } from '@jest/globals'

test('this', () => {
  const edge = {
    index: 0,
    name: 'this',
  }
  expect(IsIgnoredConstructorScopeEdge.isIgnoredConstructorScopeEdge(edge)).toBe(true)
})

test('bound_this', () => {
  const edge = {
    index: 0,
    name: 'bound_this',
  }
  expect(IsIgnoredConstructorScopeEdge.isIgnoredConstructorScopeEdge(edge)).toBe(true)
})

test('other', () => {
  const edge = {
    index: 0,
    name: 'abc',
  }
  expect(IsIgnoredConstructorScopeEdge.isIgnoredConstructorScopeEdge(edge)).toBe(false)
})
