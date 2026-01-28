import { test, expect } from '@jest/globals'
import type { FileDescriptorInfo } from '../src/parts/FileDescriptorInfo/FileDescriptorInfo.ts'

test('FileDescriptorInfo - structure', () => {
  const descriptor: FileDescriptorInfo = {
    description: 'socket',
    fd: '3',
    target: 'socket:[12345]',
  }

  expect(descriptor.description).toBe('socket')
  expect(descriptor.fd).toBe('3')
  expect(descriptor.target).toBe('socket:[12345]')
})

test('FileDescriptorInfo - readonly properties', () => {
  const descriptor: FileDescriptorInfo = {
    description: 'pipe',
    fd: '4',
    target: 'pipe:[67890]',
  }

  // TypeScript will prevent mutation at compile time
  // This test just verifies the interface shape
  expect(Object.keys(descriptor).sort()).toEqual(['description', 'fd', 'target'])
})

test('FileDescriptorInfo - with unavailable target', () => {
  const descriptor: FileDescriptorInfo = {
    description: 'unavailable',
    fd: '5',
    target: '<unavailable>',
  }

  expect(descriptor.description).toBe('unavailable')
  expect(descriptor.target).toBe('<unavailable>')
})
