import { expect, test } from '@jest/globals'
import * as GetDownloadUrl from '../src/parts/GetDownloadUrl/GetDownloadUrl.js'

test('chromium - ubuntu 24.04 - x64', () => {
  const name = 'chromium'
  const revision = '123'
  const hostPlatform = 'ubuntu24.04-x64'
  expect(GetDownloadUrl.getDownloadUrl(name, revision, hostPlatform)).toBe('builds/chromium/123/chromium-linux.zip')
})
