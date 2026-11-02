import { expect, test } from '@jest/globals'
import { findChildProcess } from '../src/parts/FindChildProcess/FindChildProcess.ts'

test('finds the language server below the selected Electron process, excluding another editor', () => {
  expect(
    findChildProcess(
      [
        { pid: 10, ppid: 1, command: 'electron' },
        { pid: 11, ppid: 10, command: 'extensionHost' },
        { pid: 12, ppid: 11, command: 'node jsonServerMain' },
        { pid: 20, ppid: 1, command: 'node jsonServerMain' },
      ],
      10,
      'jsonServerMain',
    )?.pid,
  ).toBe(12)
})

test('rejects an ambiguous match', () => {
  expect(() =>
    findChildProcess(
      [
        { pid: 12, ppid: 10, command: 'node jsonServerMain' },
        { pid: 13, ppid: 10, command: 'node jsonServerMain' },
      ],
      10,
      'jsonServerMain',
    ),
  ).toThrow('Multiple descendants')
})

test('does not match the root, an unrelated process, or a parent cycle', () => {
  expect(
    findChildProcess(
      [
        { pid: 10, ppid: 1, command: 'jsonServerMain' },
        { pid: 20, ppid: 21, command: 'jsonServerMain' },
        { pid: 21, ppid: 20, command: 'other' },
      ],
      10,
      'jsonServerMain',
    ),
  ).toBeUndefined()
})
