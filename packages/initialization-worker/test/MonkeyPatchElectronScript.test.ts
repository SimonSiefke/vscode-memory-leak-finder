import { expect, test } from '@jest/globals'
import { getMonkeyPatchElectronSafeStorageScript } from '../src/parts/MonkeyPatchElectronSafeStorageScript/MonkeyPatchElectronSafeStorageScript.ts'
import * as MonkeyPatchElectronScript from '../src/parts/MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'

test('monkeyPatchElectronScript - keeps original ready-event patch', () => {
  expect(MonkeyPatchElectronScript.monkeyPatchElectronScript).toContain('const originalWhenReady = app.whenReady()')
  expect(MonkeyPatchElectronScript.monkeyPatchElectronScript).toContain("originalEmit('ready', ...readyEventArgs)")
})

test('getMonkeyPatchElectronSafeStorageScript - injects secrets path and log path', () => {
  const script = getMonkeyPatchElectronSafeStorageScript({
    secretsPath: '/tmp/.vscode-user-data-dir/secrets/secrets.json',
  })

  expect(script).toContain('const secretsPath = "/tmp/.vscode-user-data-dir/secrets/secrets.json"')
  expect(script).toContain('const electron = globalThis._____electron || globalThis.__electron || this')
  expect(script).toContain('const globalRequire = globalThis._____require || globalThis.___require')
  expect(script).toContain('if (!fs.existsSync(secretsPath))')
  expect(script).toContain("fs.writeFileSync(secretsPath, JSON.stringify({}, null, 2) + '\\n', 'utf8')")
  expect(script).toContain("fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2) + '\\n', 'utf8')")
  expect(script).toContain("const logPath = path ? path.join(path.dirname(secretsPath), 'secrets-log.txt') : ''")
  expect(script).toContain("fs.writeFileSync(logPath, '', 'utf8')")
})

test('getMonkeyPatchElectronSafeStorageScript - patches safeStorage APIs', () => {
  const script = getMonkeyPatchElectronSafeStorageScript({
    secretsPath: '/tmp/.vscode-user-data-dir/secrets/secrets.json',
  })

  expect(script).toContain("log('[secrets-mock] secretStorage mocking disabled; using safeStorage only')")
  expect(script).toContain('if (electron.safeStorage)')
  expect(script).toContain("log('[secrets-mock] mocked electron safeStorage')")
  expect(script).toContain('safeStorage.encryptString = (plaintext) => {')
  expect(script).toContain("if (typeof safeStorage.encryptData === 'function')")
  expect(script).toContain("if (typeof safeStorage.decryptData === 'function')")
  expect(script).toContain("ensureSecretEntryForKey(key, 'encryptData')")
  expect(script).toContain("ensureSecretEntryForKey(key, 'decryptData')")
  expect(script).toContain("ensureSecretEntryForEncounteredValue(normalizedPlaintext, 'encryptString')")
  expect(script).toContain("ensureSecretEntryForEncounteredValue(decryptedText, 'decryptString')")
})

test('getMonkeyPatchElectronSafeStorageScript - logs safeStorage read events', () => {
  const script = getMonkeyPatchElectronSafeStorageScript({
    secretsPath: '/tmp/.vscode-user-data-dir/secrets/secrets.json',
  })

  expect(script).toContain('safeStorage encryptedStringBase64=')
  expect(script).toContain('safeStorage decryptedData=')
  expect(script).toContain('safeStorage self-test success=')
})
