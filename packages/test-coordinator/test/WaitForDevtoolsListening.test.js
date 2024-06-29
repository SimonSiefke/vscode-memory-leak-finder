import { expect, test } from '@jest/globals'
import EventEmitter from 'node:events'
import * as WaitForDevtoolsListening from '../src/parts/WaitForDevtoolsListening/WaitForDevtoolsListening.js'

class NoErrorThrownError extends Error {}

/**
 *
 * @param {any} fn
 * @returns {Promise<Error>}
 *  */
const getError = async (fn) => {
  try {
    await fn()
    throw new NoErrorThrownError()
  } catch (error) {
    // @ts-ignore
    return error
  }
}

test('waitForDevtoolsListening - error - electron app not found', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit(
      'data',
      `Error launching app
Unable to find Electron app at /test/e2e/fixtures/not-found

Cannot find module '/test/e2e/fixtures/not-found'
Require stack:
- /test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js
- `,
    )
  }, 0)
  await expect(WaitForDevtoolsListening.waitForDevtoolsListening(stream)).rejects.toThrowError(
    new Error(
      "Error launching app: Unable to find Electron app at /test/e2e/fixtures/not-found: Cannot find module '/test/e2e/fixtures/not-found': Require stack: - /test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js",
    ),
  )
})

test('waitForDevtoolsListening - error - main not found', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit(
      'data',
      '\u001B[1m\u001B[47m\u001B[31mError launching app\n' +
        '\u001B[30mUnable to find Electron app at /test/e2e/fixtures/sample.error-main-not-found\n' +
        '\n' +
        `Cannot find module '/test/e2e/fixtures/sample.error-main-not-found/not-found.js'. Please verify that the package.json has a valid "main" entry\u001B[0m\n`,
    )
  }, 0)
  await expect(WaitForDevtoolsListening.waitForDevtoolsListening(stream)).rejects.toThrowError(
    new Error(
      'Error launching app: Unable to find Electron app at /test/e2e/fixtures/sample.error-main-not-found: Cannot find module \'/test/e2e/fixtures/sample.error-main-not-found/not-found.js\'. Please verify that the package.json has a valid "main" entry',
    ),
  )
})

test('waitForDevtoolsListening - error - invalid package json', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit(
      'data',
      '\u001B[1m\u001B[47m\u001B[31mError launching app\n' +
        '\u001B[30mUnable to parse /test/e2e/fixtures/sample.error-invalid-package-json/package.json\n' +
        '\n' +
        "/test/e2e/fixtures/sample.error-invalid-package-json/package.json: Expected ',' or '}' after property value in JSON at position 182\u001B[0m\n",
    )
  }, 0)
  await expect(WaitForDevtoolsListening.waitForDevtoolsListening(stream)).rejects.toThrowError(
    new Error(
      "Error launching app: Unable to parse /test/e2e/fixtures/sample.error-invalid-package-json/package.json: /test/e2e/fixtures/sample.error-invalid-package-json/package.json: Expected ',' or '}' after property value in JSON at position 182",
    ),
  )
})

test('waitForDevtoolsListening - error - es modules not supported', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit('data', 'App threw an error during load\n')
    setTimeout(() => {
      stream.emit(
        'data',
        'Error [ERR_REQUIRE_ESM]: require() of ES Module /test/e2e/fixtures/sample.error-es-modules-not-supported/main.js from /test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js not supported.\n' +
          '/test/e2e/fixtures/sample.error-es-modules-not-supported/main.js is treated as an ES module file as it is a .js file whose nearest parent package.json contains "type": "module" which declares all .js files in that package scope as ES modules.\n' +
          'Instead rename /test/e2e/fixtures/sample.error-es-modules-not-supported/main.js to end in .cjs, change the requiring code to use dynamic import() which is available in all CommonJS modules, or change "type": "module" to "type": "commonjs" in /test/e2e/fixtures/sample.error-es-modules-not-supported/package.json to treat all .js files as CommonJS (using .mjs for all ES modules instead).\n' +
          '\n' +
          '    at f._load (node:electron/js2c/asar_bundle:2:13330)\n' +
          '    at loadApplicationPackage (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:121:16)\n' +
          '    at Object.<anonymous> (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:233:9)\n' +
          '    at f._load (node:electron/js2c/asar_bundle:2:13330)\n' +
          '    at node:electron/js2c/browser_init:2:115317\n' +
          '    at node:electron/js2c/browser_init:2:115520\n' +
          '    at node:electron/js2c/browser_init:2:115524\n' +
          '    at f._load (node:electron/js2c/asar_bundle:2:13330)\n',
      )
    }, 0)
  }, 0)
  await expect(WaitForDevtoolsListening.waitForDevtoolsListening(stream)).rejects.toThrowError(
    new Error(
      'App threw an error during load: Error [ERR_REQUIRE_ESM]: require() of ES Module /test/e2e/fixtures/sample.error-es-modules-not-supported/main.js from /test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js not supported.',
    ),
  )
})

test('waitForDevtoolsListening - error - syntax error in main', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit('data', 'App threw an error during load\n')
    setTimeout(() => {
      stream.emit(
        'data',
        '/test/e2e/fixtures/sample.syntax-error-in-main/main.js:1\n' +
          "const { app, BrowserWindow } = require('electron'\n" +
          '                                       ^^^^^^^^^^\n' +
          '\n' +
          'SyntaxError: missing ) after argument list\n' +
          '    at Object.compileFunction (node:vm:360:18)\n' +
          '    at wrapSafe (node:internal/modules/cjs/loader:1062:15)\n' +
          '    at Module._compile (node:internal/modules/cjs/loader:1097:27)\n' +
          '    at Module._extensions..js (node:internal/modules/cjs/loader:1196:10)\n' +
          '    at Module.load (node:internal/modules/cjs/loader:1011:32)\n' +
          '    at Module._load (node:internal/modules/cjs/loader:846:12)\n' +
          '    at f._load (node:electron/js2c/asar_bundle:2:13330)\n' +
          '    at loadApplicationPackage (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:121:16)\n' +
          '    at Object.<anonymous> (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:233:9)\n' +
          '    at Module._compile (node:internal/modules/cjs/loader:1137:14)\n',
      )
    }, 0)
  }, 0)
  const error = await getError(() => WaitForDevtoolsListening.waitForDevtoolsListening(stream))
  expect(error.message).toBe(`App threw an error during load: SyntaxError: missing ) after argument list`)
  expect(error.stack).toMatch(`App threw an error during load: SyntaxError: missing ) after argument list
    at /test/e2e/fixtures/sample.syntax-error-in-main/main.js:1
    at Object.compileFunction (node:vm:360:18)
    at wrapSafe (node:internal/modules/cjs/loader:1062:15)
    at Module._compile (node:internal/modules/cjs/loader:1097:27)
    at Module._extensions..js (node:internal/modules/cjs/loader:1196:10)
    at Module.load (node:internal/modules/cjs/loader:1011:32)
    at Module._load (node:internal/modules/cjs/loader:846:12)
    at f._load (node:electron/js2c/asar_bundle:2:13330)
    at loadApplicationPackage (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:121:16)
    at Object.<anonymous> (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:233:9)
    at Module._compile (node:internal/modules/cjs/loader:1137:14)
`)
  // @ts-ignore
  expect(error.codeFrame).toBe(
    `
const { app, BrowserWindow } = require('electron'
                                       ^^^^^^^^^^
`.trim(),
  )
})

test('waitForDevtoolsListening - error - reference error in main', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit('data', 'App threw an error during load\n')
    setTimeout(() => {
      stream.emit(
        'data',
        'ReferenceError: abc is not defined\n' +
          '    at Object.<anonymous> (/test/e2e/fixtures/sample.reference-error-in-main/main.js:16:1)\n' +
          '    at Module._compile (node:internal/modules/cjs/loader:1141:14)\n' +
          '    at Module._extensions..js (node:internal/modules/cjs/loader:1196:10)\n' +
          '    at Module.load (node:internal/modules/cjs/loader:1011:32)\n' +
          '    at Module._load (node:internal/modules/cjs/loader:846:12)\n' +
          '    at f._load (node:electron/js2c/asar_bundle:2:13330)\n' +
          '    at loadApplicationPackage (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:121:16)\n' +
          '    at Object.<anonymous> (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:233:9)\n' +
          '    at Module._compile (node:internal/modules/cjs/loader:1137:14)\n' +
          '    at Module._extensions..js (node:internal/modules/cjs/loader:1196:10)\n',
      )
    }, 0)
  }, 0)
  const error = await getError(() => WaitForDevtoolsListening.waitForDevtoolsListening(stream))
  expect(error.message).toBe(`App threw an error during load: ReferenceError: abc is not defined`)
  expect(error.stack).toMatch(`Error: App threw an error during load: ReferenceError: abc is not defined
    at Object.<anonymous> (/test/e2e/fixtures/sample.reference-error-in-main/main.js:16:1)
    at Module._compile (node:internal/modules/cjs/loader:1141:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1196:10)
    at Module.load (node:internal/modules/cjs/loader:1011:32)
    at Module._load (node:internal/modules/cjs/loader:846:12)
    at f._load (node:electron/js2c/asar_bundle:2:13330)
    at loadApplicationPackage (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:121:16)
    at Object.<anonymous> (/test/e2e/node_modules/electron/dist/resources/default_app.asar/main.js:233:9)
    at Module._compile (node:internal/modules/cjs/loader:1137:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1196:10)`)
})

test('waitForDevtoolsListening - dbus error', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit(
      'data',
      `[3264:0116/220144.316273:ERROR:bus.cc(399)] Failed to connect to the bus: Could not parse server address: Unknown address type (examples of valid types are "tcp" and on UNIX "unix")`,
    )
    setTimeout(() => {
      stream.emit(
        'data',
        '[3264:0116/220144.316348:ERROR:bus.cc(399)] Failed to connect to the bus: Could not parse server address: Unknown address type (examples of valid types are "tcp" and on UNIX "unix")',
      )
      setTimeout(() => {
        stream.emit(`data`, `DevTools listening on ws://127.0.0.1:43293/devtools/browser/01f4838d-0a5e-43dd-8404-f8a1ba2e4ace`)
      }, 0)
    }, 0)
  }, 0)
  expect(await WaitForDevtoolsListening.waitForDevtoolsListening(stream)).toBe(
    'ws://127.0.0.1:43293/devtools/browser/01f4838d-0a5e-43dd-8404-f8a1ba2e4ace',
  )
})

test('waitForDevtoolsListening - gpu process error', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit('data', `[3293:0116/220144.430464:ERROR:viz_main_impl.cc(186)] Exiting GPU process due to errors during initialization`)
    setTimeout(() => {
      stream.emit(`data`, `DevTools listening on ws://127.0.0.1:43293/devtools/browser/01f4838d-0a5e-43dd-8404-f8a1ba2e4ace`)
    }, 0)
  }, 0)
  expect(await WaitForDevtoolsListening.waitForDevtoolsListening(stream)).toBe(
    'ws://127.0.0.1:43293/devtools/browser/01f4838d-0a5e-43dd-8404-f8a1ba2e4ace',
  )
})

test('waitForDevtoolsListening - gpu memory buffer support error', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit('data', `[3358:0116/220144.457834:ERROR:gpu_memory_buffer_support_x11.cc(44)] dri3 extension not supported.`)
    setTimeout(() => {
      stream.emit(`data`, `DevTools listening on ws://127.0.0.1:43293/devtools/browser/01f4838d-0a5e-43dd-8404-f8a1ba2e4ace`)
    }, 0)
  }, 0)
  expect(await WaitForDevtoolsListening.waitForDevtoolsListening(stream)).toBe(
    'ws://127.0.0.1:43293/devtools/browser/01f4838d-0a5e-43dd-8404-f8a1ba2e4ace',
  )
})

test('waitForDevtoolsListening - gpu memory buffer support error', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit(
      'data',
      `[4622:0116/221857.434785:ERROR:zygote_host_impl_linux.cc(273)] Failed to adjust OOM score of renderer with pid 4652: Permission denied (13)`,
    )
    setTimeout(() => {
      stream.emit(`data`, `DevTools listening on ws://127.0.0.1:43293/devtools/browser/01f4838d-0a5e-43dd-8404-f8a1ba2e4ace`)
    }, 0)
  }, 0)
  expect(await WaitForDevtoolsListening.waitForDevtoolsListening(stream)).toBe(
    'ws://127.0.0.1:43293/devtools/browser/01f4838d-0a5e-43dd-8404-f8a1ba2e4ace',
  )
})
