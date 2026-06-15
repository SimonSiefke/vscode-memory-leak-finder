import { test, expect } from '@jest/globals'
import * as GetVsCodeEnv from '../src/parts/GetVsCodeEnv/GetVsCodeEnv.ts'

test('getVsCodeEnv - remove node options', () => {
  const runtimeDir = '/test'
  const processEnv = {
    NODE_OPTIONS: '--max-old-space-size=8192',
  }
  expect(GetVsCodeEnv.getVsCodeEnv({ processEnv, runtimeDir })).toEqual({
    XDG_RUNTIME_DIR: '/test',
  })
})

test('getVsCodeEnv - remove electron run as node', () => {
  const runtimeDir = '/test'
  const processEnv = {
    ELECTRON_RUN_AS_NODE: 'true',
  }
  expect(GetVsCodeEnv.getVsCodeEnv({ processEnv, runtimeDir })).toEqual({
    XDG_RUNTIME_DIR: '/test',
  })
})

test('getVsCodeEnv - disable keytar in ci', () => {
  const runtimeDir = '/test'
  const userDataDir = '/tmp/vscode-user-data-dir'
  const processEnv = {
    CI: 'true',
  }
  expect(GetVsCodeEnv.getVsCodeEnv({ processEnv, runtimeDir, userDataDir })).toEqual({
    CI: 'true',
    COPILOT_HOME: '/tmp/vscode-user-data-dir/copilot-home',
    COPILOT_DISABLE_KEYTAR: '1',
    XDG_RUNTIME_DIR: '/test',
  })
})

test('getVsCodeEnv - disable keytar in github actions', () => {
  const runtimeDir = '/test'
  const userDataDir = '/tmp/vscode-user-data-dir'
  const processEnv = {
    GITHUB_ACTIONS: 'true',
  }
  expect(GetVsCodeEnv.getVsCodeEnv({ processEnv, runtimeDir, userDataDir })).toEqual({
    COPILOT_DISABLE_KEYTAR: '1',
    COPILOT_HOME: '/tmp/vscode-user-data-dir/copilot-home',
    GITHUB_ACTIONS: 'true',
    XDG_RUNTIME_DIR: '/test',
  })
})
