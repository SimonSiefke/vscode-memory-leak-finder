import { expect, test } from '@jest/globals'
import { applyMonkeyPatches } from '../src/parts/ApplyMonkeyPatches/ApplyMonkeyPatches.ts'

test('applyMonkeyPatches - injects secrets path into monkey patch script', async () => {
  const calls: Array<{ method: string; params: any }> = []

  const electronRpc = {
    invoke: async (method: string, params: any) => {
      calls.push({ method, params })
      if (
        method === 'Runtime.callFunctionOn' &&
        params.objectId === 'electron-object' &&
        params.functionDeclaration.includes('const originalWhenReady = app.whenReady()')
      ) {
        return {
          result: {
            result: {
              objectId: 'patched-electron-id',
              type: 'function',
            },
          },
        }
      }
      return {
        result: {
          result: {
            type: 'undefined',
          },
        },
      }
    },
  }

  const monkeyPatchedElectronId = await applyMonkeyPatches(
    electronRpc as any,
    'electron-object',
    'require-object',
    '/tmp/.vscode-user-data-dir/secrets/secrets.json',
    false,
    false,
    false,
  )

  expect(monkeyPatchedElectronId).toBe('patched-electron-id')
  const baseMonkeyPatchCall = calls.find(
    (call) =>
      call.method === 'Runtime.callFunctionOn' &&
      call.params.objectId === 'electron-object' &&
      call.params.functionDeclaration.includes('const originalWhenReady = app.whenReady()'),
  )
  expect(baseMonkeyPatchCall).toBeDefined()

  const safeStoragePatchCall = calls.find(
    (call) =>
      call.method === 'Runtime.callFunctionOn' &&
      call.params.objectId === 'electron-object' &&
      call.params.functionDeclaration.includes('const secretsPath = "/tmp/.vscode-user-data-dir/secrets/secrets.json"') &&
      call.params.functionDeclaration.includes('[secrets-mock] mocked electron safeStorage'),
  )
  expect(safeStoragePatchCall).toBeDefined()
})

test('applyMonkeyPatches - applies ipc monkey patch for ipc messages from start measure', async () => {
  const calls: Array<{ method: string; params: any }> = []

  const electronRpc = {
    invoke: async (method: string, params: any) => {
      calls.push({ method, params })
      if (
        method === 'Runtime.callFunctionOn' &&
        params.objectId === 'electron-object' &&
        params.functionDeclaration.includes('const originalWhenReady = app.whenReady()')
      ) {
        return {
          result: {
            result: {
              objectId: 'patched-electron-id',
              type: 'function',
            },
          },
        }
      }
      return {
        result: {
          result: {
            type: 'undefined',
          },
        },
      }
    },
  }

  await applyMonkeyPatches(
    electronRpc as any,
    'electron-object',
    'require-object',
    '',
    false,
    false,
    false,
    'ipcMessagesFromStart',
  )

  const ipcPatchCall = calls.find(
    (call) =>
      call.method === 'Runtime.callFunctionOn' &&
      call.params.objectId === 'electron-object' &&
      call.params.functionDeclaration.includes('globalThis.__ipcMessages = []'),
  )
  expect(ipcPatchCall).toBeDefined()
})
