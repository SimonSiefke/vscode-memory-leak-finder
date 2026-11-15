import { expect, test } from '@jest/globals'
import * as CompareFileDescriptorCount from '../src/parts/CompareFileDescriptorCount/CompareFileDescriptorCount.ts'

test('compareFileDescriptorCount does not report stable processes with duplicate names as a leak', () => {
  const before = [
    { fileDescriptorCount: 80, name: 'VS Code Utility', pid: 1 },
    { fileDescriptorCount: 3, name: 'VS Code Utility', pid: 2 },
  ]
  const after = [
    { fileDescriptorCount: 81, name: 'VS Code Utility', pid: 1 },
    { fileDescriptorCount: 4, name: 'VS Code Utility', pid: 2 },
  ]

  expect(CompareFileDescriptorCount.compareFileDescriptorCount(before, after, { runs: 37 })).toEqual([])
})

test('compareFileDescriptorCount detects descriptor growth across processes with duplicate names', () => {
  const before = [
    { fileDescriptorCount: 80, name: 'VS Code Utility', pid: 1 },
    { fileDescriptorCount: 3, name: 'VS Code Utility', pid: 2 },
  ]
  const after = [
    { fileDescriptorCount: 100, name: 'VS Code Utility', pid: 1 },
    { fileDescriptorCount: 24, name: 'VS Code Utility', pid: 2 },
  ]

  expect(CompareFileDescriptorCount.compareFileDescriptorCount(before, after, { runs: 37 })).toEqual([
    { count: 124, delta: 41, name: 'VS Code Utility' },
  ])
})
