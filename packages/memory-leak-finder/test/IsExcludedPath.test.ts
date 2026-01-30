import { test, expect } from '@jest/globals'
import { isExcludedPath } from '../src/parts/IsExcludedPath/IsExcludedPath.ts'

test('isExcludedPath - excludes Dictionaries pattern', () => {
  expect(isExcludedPath('/path/to/Dictionaries')).toBe(true)
  expect(isExcludedPath('/home/user/Dictionaries/file.txt')).toBe(true)
  expect(isExcludedPath('Dictionaries')).toBe(true)
})

test('isExcludedPath - excludes Local Storage pattern', () => {
  expect(isExcludedPath('/path/to/Local Storage')).toBe(true)
  expect(isExcludedPath('/home/user/Local Storage/db.txt')).toBe(true)
  expect(isExcludedPath('Local Storage')).toBe(true)
})

test('isExcludedPath - excludes dmabuf pattern', () => {
  expect(isExcludedPath('/path/to/dmabuf')).toBe(true)
  expect(isExcludedPath('/dmabuf')).toBe(true)
  expect(isExcludedPath('dmabuf')).toBe(true)
})

test('isExcludedPath - excludes SharedStorage pattern', () => {
  expect(isExcludedPath('/path/to/SharedStorage')).toBe(true)
  expect(isExcludedPath('/home/user/SharedStorage/data')).toBe(true)
  expect(isExcludedPath('SharedStorage')).toBe(true)
})

test('isExcludedPath - excludes nssdb pattern', () => {
  expect(isExcludedPath('/path/to/nssdb')).toBe(true)
  expect(isExcludedPath('/home/user/.nssdb')).toBe(true)
  expect(isExcludedPath('nssdb')).toBe(true)
})

test('isExcludedPath - excludes systemd pattern', () => {
  expect(isExcludedPath('/path/to/systemd')).toBe(true)
  expect(isExcludedPath('/run/systemd/journal')).toBe(true)
  expect(isExcludedPath('systemd')).toBe(true)
})

test('isExcludedPath - excludes memfs pattern', () => {
  expect(isExcludedPath('/path/to/memfs')).toBe(true)
  expect(isExcludedPath('/memfs')).toBe(true)
  expect(isExcludedPath('memfs')).toBe(true)
})

test('isExcludedPath - excludes /dev paths except /dev/ptmx', () => {
  expect(isExcludedPath('/dev/null')).toBe(true)
  expect(isExcludedPath('/dev/zero')).toBe(true)
  expect(isExcludedPath('/dev/random')).toBe(true)
  expect(isExcludedPath('/dev/urandom')).toBe(true)
  expect(isExcludedPath('/dev/pts/0')).toBe(true)
  expect(isExcludedPath('/dev/shm/file')).toBe(true)
})

test('isExcludedPath - includes /dev/ptmx', () => {
  expect(isExcludedPath('/dev/ptmx')).toBe(false)
})

test('isExcludedPath - includes /dev/udmabuf', () => {
  expect(isExcludedPath('/dev/udmabuf')).toBe(false)
})

test('isExcludedPath - does not exclude regular file paths', () => {
  expect(isExcludedPath('/home/user/file.txt')).toBe(false)
  expect(isExcludedPath('/usr/local/bin/app')).toBe(false)
  expect(isExcludedPath('/tmp/session')).toBe(false)
  expect(isExcludedPath('regular-file.txt')).toBe(false)
})

test('isExcludedPath - does not exclude socket/pipe descriptors', () => {
  expect(isExcludedPath('socket:[12345]')).toBe(false)
  expect(isExcludedPath('pipe:[67890]')).toBe(false)
  expect(isExcludedPath('anon_inode:[eventpoll]')).toBe(false)
})

test('isExcludedPath - case sensitive pattern matching', () => {
  // Patterns should be case sensitive
  expect(isExcludedPath('dictionaries')).toBe(false)
  expect(isExcludedPath('local storage')).toBe(false)
  expect(isExcludedPath('DICTIONARIES')).toBe(false)
  expect(isExcludedPath('LOCAL STORAGE')).toBe(false)
})

test('isExcludedPath - patterns work as substring matches', () => {
  // Since the function uses includes(), patterns can appear anywhere in the path
  expect(isExcludedPath('/some/Dictionaries/path')).toBe(true)
  expect(isExcludedPath('/path/Local Storage/file')).toBe(true)
  expect(isExcludedPath('prefix_nssdb_suffix')).toBe(true)
})

test('isExcludedPath - empty string', () => {
  expect(isExcludedPath('')).toBe(false)
})

test('isExcludedPath - paths with multiple excluded patterns', () => {
  // Should exclude if any pattern matches
  expect(isExcludedPath('/path/with/Dictionaries/and/Local Storage')).toBe(true)
  expect(isExcludedPath('/home/Local Storage/Dictionaries')).toBe(true)
})
