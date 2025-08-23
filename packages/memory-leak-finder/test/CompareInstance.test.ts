import { test, expect } from '@jest/globals'
import * as CompareInstance from '../src/parts/CompareInstance/CompareInstance.ts'

test('compareInstance - by name', () => {
  const a = {
    name: 'NotebookOutlineAccessibility',
    count: 2,
  }
  const b = {
    name: 'class extends Action2',
    count: 2,
  }
  expect(CompareInstance.compareInstance(a, b)).toBe(1)
})

test('compareInstance - by count', () => {
  const a = {
    name: 'NotebookOutlineAccessibility',
    count: 2,
  }
  const b = {
    name: 'NotebookOutlineAccessibility',
    count: 3,
  }
  expect(CompareInstance.compareInstance(a, b)).toBe(1)
})
