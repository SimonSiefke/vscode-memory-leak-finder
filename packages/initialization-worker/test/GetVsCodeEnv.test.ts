import { test, expect } from '@jest/globals'
import * as GetVsCodeEnv from '../src/parts/GetVsCodeEnv/GetVsCodeEnv.ts'

test('getVsCodeEnv - remove node options', () => {
  const runtimeDir = '/test'
  const processEnv = {
    NODE_OPTIONS: '--max-old-space-size=8192',
  }
  expect(GetVsCodeEnv.getVsCodeEnv({ runtimeDir, processEnv })).toEqual({
    XDG_RUNTIME_DIR: '/test',
  })
})

test('getVsCodeEnv - remove electron run as node', () => {
  const runtimeDir = '/test'
  const processEnv = {
    ELECTRON_RUN_AS_NODE: 'true',
  }
  expect(GetVsCodeEnv.getVsCodeEnv({ runtimeDir, processEnv })).toEqual({
    XDG_RUNTIME_DIR: '/test',
  })
})
