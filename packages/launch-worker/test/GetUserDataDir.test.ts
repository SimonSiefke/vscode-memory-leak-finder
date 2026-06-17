import { expect, test } from '@jest/globals'
import * as GetUserDataDir from '../src/parts/GetUserDataDir/GetUserDataDir.ts'

test('getUserDataDir - uses repo local path on linux', () => {
  expect(GetUserDataDir.getUserDataDir('linux')).toContain('.vscode-user-data-dir')
})

test('getUserDataDir - uses short tmp path on darwin', () => {
  const userDataDir = GetUserDataDir.getUserDataDir('darwin')

  expect(userDataDir).toBe(`/tmp/vmlf-${process.pid}-ud`)
  expect(userDataDir.length).toBeLessThan(40)
})
