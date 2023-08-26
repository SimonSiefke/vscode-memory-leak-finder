import * as GetElectronErrorMessage from '../src/parts/GetElectronErrorMessage/GetElectronErrorMessage.js'

test('error - electron app not found', async () => {
  const firstData =
    '\x1B[1m\x1B[47m\x1B[31mError launching app\n' +
    '\x1B[30mUnable to find Electron app at /test/e2e/fixtures/not-found\n' +
    '\n' +
    "Cannot find module '/test/e2e/fixtures/not-found'\n" +
    'Require stack:\n' +
    '- /test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js\n' +
    '- \x1B[0m\n'
  const error = await GetElectronErrorMessage.getElectronErrorMessage(firstData)
  expect(error.message).toBe(
    `Error launching app: Unable to find Electron app at /test/e2e/fixtures/not-found: Cannot find module '/test/e2e/fixtures/not-found': Require stack: - /test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js`
  )
})

test('error - main not found', async () => {
  const firstData =
    '\x1B[1m\x1B[47m\x1B[31mError launching app\n' +
    '\x1B[30mUnable to find Electron app at /test/e2e/fixtures/sample.error-main-not-found\n' +
    '\n' +
    `Cannot find module '/test/e2e/fixtures/sample.error-main-not-found/not-found.js'. Please verify that the package.json has a valid "main" entry\x1B[0m\n`
  const error = await GetElectronErrorMessage.getElectronErrorMessage(firstData)
  expect(error.message).toBe(
    `Error launching app: Unable to find Electron app at /test/e2e/fixtures/sample.error-main-not-found: Cannot find module '/test/e2e/fixtures/sample.error-main-not-found/not-found.js'. Please verify that the package.json has a valid \"main\" entry`
  )
})

test('error - invalid package json', async () => {
  const firstData =
    '\x1B[1m\x1B[47m\x1B[31mError launching app\n' +
    '\x1B[30mUnable to parse /test/e2e/fixtures/sample.error-invalid-package-json/package.json\n' +
    '\n' +
    "/test/e2e/fixtures/sample.error-invalid-package-json/package.json: Expected ',' or '}' after property value in JSON at position 182\x1B[0m\n"
  const error = await GetElectronErrorMessage.getElectronErrorMessage(firstData)
  expect(error.message).toBe(
    `Error launching app: Unable to parse /test/e2e/fixtures/sample.error-invalid-package-json/package.json: /test/e2e/fixtures/sample.error-invalid-package-json/package.json: Expected ',' or '}' after property value in JSON at position 182`
  )
})
