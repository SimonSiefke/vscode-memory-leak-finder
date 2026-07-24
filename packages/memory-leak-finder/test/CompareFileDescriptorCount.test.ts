import { expect, test } from '@jest/globals'
import { compareFileDescriptorCount } from '../src/parts/CompareFileDescriptorCount/CompareFileDescriptorCount.ts'

test('matches processes by pid when names are identical', () => {
  const before = [
    { fileDescriptorCount: 12, name: 'VS Code', pid: 101 },
    { fileDescriptorCount: 180, name: 'VS Code', pid: 102 },
  ]
  const after = [
    { fileDescriptorCount: 12, name: 'VS Code', pid: 101 },
    { fileDescriptorCount: 180, name: 'VS Code', pid: 102 },
  ]

  expect(compareFileDescriptorCount(before, after, { runs: 1 })).toEqual([])
})

test('reports a per-run descriptor increase for the matching process', () => {
  const before = [
    { fileDescriptorCount: 12, name: 'VS Code', pid: 101 },
    { fileDescriptorCount: 20, name: 'VS Code', pid: 102 },
  ]
  const after = [
    { fileDescriptorCount: 29, name: 'VS Code', pid: 101 },
    { fileDescriptorCount: 20, name: 'VS Code', pid: 102 },
  ]

  expect(compareFileDescriptorCount(before, after, { runs: 17 })).toEqual([
    {
      count: 29,
      delta: 17,
      name: 'VS Code',
    },
  ])
})
