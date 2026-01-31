import { test, expect } from '@jest/globals'
import type { ProcessInfoWithDescriptors } from '../src/parts/ProcessInfoWithDescriptors/ProcessInfoWithDescriptors.ts'
import type { FileDescriptorInfo } from '../src/parts/FileDescriptorInfo/FileDescriptorInfo.ts'

test('ProcessInfoWithDescriptors - structure', () => {
  const descriptors: FileDescriptorInfo[] = [
    { description: 'socket', fd: '3', target: 'socket:[12345]' },
    { description: 'pipe', fd: '4', target: 'pipe:[67890]' },
  ]

  const processInfo: ProcessInfoWithDescriptors = {
    fileDescriptorCount: 2,
    fileDescriptors: descriptors,
    name: 'test-process',
    pid: 1234,
  }

  expect(processInfo.fileDescriptorCount).toBe(2)
  expect(processInfo.fileDescriptors.length).toBe(2)
  expect(processInfo.name).toBe('test-process')
  expect(processInfo.pid).toBe(1234)
})

test('ProcessInfoWithDescriptors - empty descriptors', () => {
  const processInfo: ProcessInfoWithDescriptors = {
    fileDescriptorCount: 0,
    fileDescriptors: [],
    name: 'idle-process',
    pid: 5678,
  }

  expect(processInfo.fileDescriptorCount).toBe(0)
  expect(processInfo.fileDescriptors).toEqual([])
})

test('ProcessInfoWithDescriptors - readonly properties', () => {
  const processInfo: ProcessInfoWithDescriptors = {
    fileDescriptorCount: 1,
    fileDescriptors: [{ description: 'file', fd: '3', target: '/tmp/test.txt' }],
    name: 'process',
    pid: 999,
  }

  // TypeScript will prevent mutation at compile time
  // This test just verifies the interface shape
  expect(Object.keys(processInfo).sort()).toEqual(['fileDescriptorCount', 'fileDescriptors', 'name', 'pid'])
})
