import { test, expect } from '@jest/globals'
import * as CompareInstance from '../src/parts/CompareInstance/CompareInstance.ts'

test('compareInstance - by name', () => {
  const a = {
    count: 2,
    name: 'NotebookOutlineAccessibility',
  }
  const b = {
    count: 2,
    name: 'class extends Action2',
  }
  expect(CompareInstance.compareInstance(a, b)).toBe(1)
})

test('compareInstance - by count', () => {
  const a = {
    count: 2,
    name: 'NotebookOutlineAccessibility',
  }
  const b = {
    count: 3,
    name: 'NotebookOutlineAccessibility',
  }
  expect(CompareInstance.compareInstance(a, b)).toBe(1)
})
