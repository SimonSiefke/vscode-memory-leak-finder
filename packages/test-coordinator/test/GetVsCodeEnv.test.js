import * as GetVsCodeEnv from '../src/parts/GetVsCodeEnv/GetVsCodeEnv.js'
import { test, expect } from '@jest/globals'

test('getVsCodeEnv - remove node options', () => {
  const runtimeDir = '/test'
  const processEnv = {
    NODE_OPTIONS: '--max-old-space-size=8192',
  }
  expect(GetVsCodeEnv.getVsCodeEnv({ runtimeDir, processEnv })).toEqual({
    XDG_RUNTIME_DIR: '/test',
  })
})
