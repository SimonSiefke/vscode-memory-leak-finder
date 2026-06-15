import { test, expect } from '@jest/globals'
import EventEmitter from 'node:events'
import * as GetElectronErrorMessage from '../src/parts/GetElectronErrorMessage/GetElectronErrorMessage.ts'

test('error - electron app not found', async () => {
  const firstData =
    '\u001B[1m\u001B[47m\u001B[31mError launching app\n' +
    '\u001B[30mUnable to find Electron app at /test/e2e/fixtures/not-found\n' +
    '\n' +
    "Cannot find module '/test/e2e/fixtures/not-found'\n" +
    'Require stack:\n' +
    '- /test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js\n' +
    '- \u001B[0m\n'
  const error = await GetElectronErrorMessage.getElectronErrorMessage(firstData)
  expect(error.message).toBe(
    `Error launching app: Unable to find Electron app at /test/e2e/fixtures/not-found: Cannot find module '/test/e2e/fixtures/not-found': Require stack: - /test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js`,
  )
})

test('error - main not found', async () => {
  const firstData =
    '\u001B[1m\u001B[47m\u001B[31mError launching app\n' +
    '\u001B[30mUnable to find Electron app at /test/e2e/fixtures/sample.error-main-not-found\n' +
    '\n' +
    `Cannot find module '/test/e2e/fixtures/sample.error-main-not-found/not-found.js'. Please verify that the package.json has a valid "main" entry\u001B[0m\n`
  const error = await GetElectronErrorMessage.getElectronErrorMessage(firstData)
  expect(error.message).toBe(
    `Error launching app: Unable to find Electron app at /test/e2e/fixtures/sample.error-main-not-found: Cannot find module '/test/e2e/fixtures/sample.error-main-not-found/not-found.js'. Please verify that the package.json has a valid \"main\" entry`,
  )
})

test('error - invalid package json', async () => {
  const firstData =
    '\u001B[1m\u001B[47m\u001B[31mError launching app\n' +
    '\u001B[30mUnable to parse /test/e2e/fixtures/sample.error-invalid-package-json/package.json\n' +
    '\n' +
    "/test/e2e/fixtures/sample.error-invalid-package-json/package.json: Expected ',' or '}' after property value in JSON at position 182\u001B[0m\n"
  const error = await GetElectronErrorMessage.getElectronErrorMessage(firstData)
  expect(error.message).toBe(
    `Error launching app: Unable to parse /test/e2e/fixtures/sample.error-invalid-package-json/package.json: /test/e2e/fixtures/sample.error-invalid-package-json/package.json: Expected ',' or '}' after property value in JSON at position 182`,
  )
})

test('error - app threw during load in first chunk', async () => {
  const firstData =
    'App threw an error during load\n' +
    'ReferenceError: abc is not defined\n' +
    '    at Object.<anonymous> (/test/e2e/fixtures/sample.reference-error-in-main/main.js:16:1)\n' +
    '    at Module._compile (node:internal/modules/cjs/loader:1141:14)\n'
  const error = await GetElectronErrorMessage.getElectronErrorMessage(firstData)
  expect(error.message).toBe(`App threw an error during load: ReferenceError: abc is not defined`)
  expect(error.stack).toMatch(`Error: App threw an error during load: ReferenceError: abc is not defined
    at Object.<anonymous> (/test/e2e/fixtures/sample.reference-error-in-main/main.js:16:1)
    at Module._compile (node:internal/modules/cjs/loader:1141:14)`)
})

test('error - app threw during load and stream closes without details', async () => {
  const stream = new EventEmitter()
  setTimeout(() => {
    stream.emit('close')
  }, 0)
  const error = await GetElectronErrorMessage.getElectronErrorMessage('App threw an error during load\n', stream)
  expect(error.message).toBe(`App threw an error during load`)
})
