import { afterEach, expect, test } from '@jest/globals'
import * as GetUserDataDir from '../src/parts/GetUserDataDir/GetUserDataDir.ts'

const originalUserDataDir = process.env.VSCODE_PERFORMANCE_USER_DATA_DIR

afterEach(() => {
  if (originalUserDataDir === undefined) {
    delete process.env.VSCODE_PERFORMANCE_USER_DATA_DIR
  } else {
    process.env.VSCODE_PERFORMANCE_USER_DATA_DIR = originalUserDataDir
  }
})

test('getUserDataDir uses the isolated performance profile when configured', () => {
  process.env.VSCODE_PERFORMANCE_USER_DATA_DIR = '/tmp/isolated-vscode-performance-profile'

  expect(GetUserDataDir.getUserDataDir('linux')).toBe('/tmp/isolated-vscode-performance-profile')
})
