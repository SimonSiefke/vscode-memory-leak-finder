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
    9876,
    null,
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
