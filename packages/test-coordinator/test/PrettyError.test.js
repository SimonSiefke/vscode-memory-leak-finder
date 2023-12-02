import { jest } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

jest.unstable_mockModule('../src/parts/FileSystem/FileSystem.js', () => {
  return {
    readFileSync: jest.fn(() => {
      throw new Error('not implemented')
    }),
  }
})

const FileSystem = await import('../src/parts/FileSystem/FileSystem.js')
const PrettyError = await import('../src/parts/PrettyError/PrettyError.js')

class ExpectError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ExpectError'
  }
}

test('prepare - exclude node internal stack', async () => {
  // @ts-ignore
  FileSystem.readFileSync.mockImplementation(() => {
    return `export const watch = ['']

export const launch = async ({ electron }) => {
  const cliPath = './node_modules/electron/dist/electron'
  const args = []
  const electronApp = await electron.launch(cliPath, args)
  return {
    electronApp,
  }
}

export const test = async ({ electronApp, expect }) => {
  const window = await electronApp.firstWindow()
  await window.close()
  await expect(electronApp).toHaveWindowCount(0)
}
`
  })
  const error = new ExpectError(`expected window count to be 0 but was 1`)
  error.stack =
    'ExpectError: expected window count to be 0 but was 1\n' +
    '    at waitForWindowCount (/test/test-worker/src/parts/Expect/Expect.js:14:11)\n' +
    '    at Object.toHaveWindowCount (/test/test-worker/src/parts/Expect/Expect.js:47:13)\n' +
    '    at Module.test (/test/e2e/src/sample.close-window.js:15:29)\n' +
    '    at async Module.runTest (/test/test-worker/src/parts/RunTest/RunTest.js:23:5)\n' +
    '    at async runTests (/test/test-worker/src/parts/RunTests/RunTests.js:30:5)'
  const prettyError = await PrettyError.prepare(error, { color: false })
  expect(prettyError.type).toBe('ExpectError')
  expect(prettyError.message).toBe(`expected window count to be 0 but was 1`)
  expect(prettyError.codeFrame).toBe(`  13 |   const window = await electronApp.firstWindow()
  14 |   await window.close()
> 15 |   await expect(electronApp).toHaveWindowCount(0)
     |                             ^
  16 | }
  17 |`)
  expect(prettyError.stack).toBe('    at test (/test/e2e/src/sample.close-window.js:15:29)')
})

test('prepare - exclude electron internal stack', async () => {
  // @ts-ignore
  FileSystem.readFileSync.mockImplementation(() => {
    return `const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {},
  })
  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})

abc

`
  })
  const error = new ReferenceError(`abc is not defined`)
  error.stack = `ReferenceError: abc is not defined
    at Object.<anonymous> (/test/e2e/fixtures/sample.reference-error-in-main/main.js:16:1)
    at Module._compile (node:internal/modules/cjs/loader:1141:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1196:10)
    at Module.load (node:internal/modules/cjs/loader:1011:32)
    at Module._load (node:internal/modules/cjs/loader:846:12)
    at f._load (node:electron/js2c/asar_bundle:2:13330)
    at loadApplicationPackage (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:121:16)
    at Object.<anonymous> (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:233:9)
    at Module._compile (node:internal/modules/cjs/loader:1137:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1196:10)`
  const prettyError = await PrettyError.prepare(error, { color: false, root: '/test/e2e' })
  expect(prettyError.type).toBe('ReferenceError')
  expect(prettyError.message).toBe(`abc is not defined`)
  expect(prettyError.codeFrame).toBe(`  14 | })
  15 |
> 16 | abc
     | ^
  17 |
  18 |`)
  if (process.platform === 'win32') {
    // TODO stack should be the same on windows, using slash
    expect(prettyError.stack).toBe('    at <anonymous> (fixtures\\sample.reference-error-in-main\\main.js:16:1)')
  } else {
    expect(prettyError.stack).toBe('    at <anonymous> (fixtures/sample.reference-error-in-main/main.js:16:1)')
  }
})

test('prepare - assertion error', async () => {
  // @ts-ignore
  FileSystem.readFileSync.mockImplementation(() => {
    return `import { AssertionError } from '../AssertionError/AssertionError.js'

const getType = (value) => {
  switch (typeof value) {
    case 'number':
      return 'number'
    case 'function':
      return 'function'
    case 'string':
      return 'string'
    case 'object':
      if (value === null) {
        return 'null'
      }
      if (Array.isArray(value)) {
        return 'array'
      }
      return 'object'
    case 'boolean':
      return 'boolean'
    default:
      return 'unknown'
  }
}

export const object = (value) => {
  const type = getType(value)
  if (type !== 'object') {
    throw new AssertionError('expected value to be of type object')
  }
}

export const number = (value) => {
  const type = getType(value)
  if (type !== 'number') {
    throw new AssertionError('expected value to be of type number')
  }
}

export const array = (value) => {
  const type = getType(value)
  if (type !== 'array') {
    throw new AssertionError('expected value to be of type array')
  }
}

export const string = (value) => {
  const type = getType(value)
  if (type !== 'string') {
    throw new AssertionError('expected value to be of type string')
  }
}

export const boolean = (value) => {
  const type = getType(value)
  if (type !== 'boolean') {
    throw new AssertionError('expected value to be of type boolean')
  }
}
`
  })
  class AssertionError extends Error {
    constructor(message) {
      super(message)
      this.name = 'AssertionError'
    }
  }
  const error = new AssertionError(`expected value to be of type boolean`)
  error.stack = ` AssertionError: expected value to be of type boolean
    at Module.boolean (/test/e2e/vscode-memory-leak-finder/packages/test-coordinator/src/parts/Assert/Assert.js:57:11)
    at Module.create (/test/e2e/vscode-memory-leak-finder/packages/test-coordinator/src/parts/PageObject/PageObject.js:9:10)
    at Module.prepareTestsOrAttach (/test/e2e/vscode-memory-leak-finder/packages/test-coordinator/src/parts/PrepareTestsOrAttach/PrepareTestsOrAttach.js:39:20)
    at async Module.runTests (/test/e2e/vscode-memory-leak-finder/packages/test-coordinator/src/parts/RunTestsWithCallback/RunTestsWithCallback.js:48:27)
    at async Module.getResponse (/test/e2e/vscode-memory-leak-finder/packages/test-coordinator/src/parts/GetResponse/GetResponse.js:6:20)
    at async Module.handleJsonRpcMessage (/test/e2e/vscode-memory-leak-finder/packages/test-coordinator/src/parts/HandleJsonRpcMessage/HandleJsonRpcMessage.js:8:20),`
  const prettyError = await PrettyError.prepare(error, { color: false, root: '/test/e2e' })
  expect(prettyError.type).toBe('AssertionError')
  expect(prettyError.message).toBe(`expected value to be of type boolean`)
  expect(prettyError.codeFrame).toBe(`  55 |   const type = getType(value)
  56 |   if (type !== 'boolean') {
> 57 |     throw new AssertionError('expected value to be of type boolean')
     |           ^
  58 |   }
  59 | }
  60 |`)
})
