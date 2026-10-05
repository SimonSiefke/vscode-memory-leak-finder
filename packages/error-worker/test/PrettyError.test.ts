import { test, expect, jest, beforeEach } from '@jest/globals'

const mockReadFileSync = jest.fn()
const mockExistsSync = jest.fn()
const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

beforeEach(() => {
  jest.resetModules()
  mockReadFileSync.mockClear()
  mockExistsSync.mockClear()
  warnSpy.mockClear()
  mockExistsSync.mockReturnValue(false)
})

jest.unstable_mockModule('node:fs', () => {
  return {
    readFileSync: mockReadFileSync,
  }
})

jest.unstable_mockModule('../src/parts/FileSystem/FileSystem.ts', () => {
  return {
    existsSync: mockExistsSync,
    readFileSync: jest.fn(() => {
      throw new Error('not implemented')
    }),
  }
})

const FileSystem = await import('../src/parts/FileSystem/FileSystem.ts')
const PrettyError = await import('../src/parts/PrettyError/PrettyError.ts')

class ExpectError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExpectError'
  }
}

test('prepare - exclude node internal stack', async () => {
  // @ts-ignore
  FileSystem.readFileSync.mockImplementation(() => {
    return `export const watch = ['']
`
  })
  const error = new ExpectError('test error')
  error.stack = `ExpectError: test error
    at Object.<anonymous> (/test/e2e/Test.test.ts:1:1)
    at Module._compile (node:internal/modules/cjs/loader:1234:56)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1289:10)
    at Module.load (node:internal/modules/cjs/loader:1092:32)
    at Function.Module._load (node:internal/modules/cjs/loader:938:27)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/cjs/loader:1862:12)
    at node:internal/main/run_main_module:23:47`
  const prettyError = await PrettyError.prepare(error, { color: false })
  expect(prettyError.message).toBe('test error')
  expect(prettyError.stack).not.toContain('node:internal')
  expect(prettyError.stack).toContain('/test/e2e/Test.test.ts:1:1')
})

test('prepare - with root option', async () => {
  // @ts-ignore
  FileSystem.readFileSync.mockImplementation(() => {
    return `export const watch = ['']
`
  })
  const error = new ExpectError('test error')
  error.stack = `ExpectError: test error
    at Object.<anonymous> (/test/e2e/Test.test.ts:1:1)
    at Module._compile (node:internal/modules/cjs/loader:1234:56)`
  const prettyError = await PrettyError.prepare(error, { color: false, root: '/test/e2e' })
  expect(prettyError.message).toBe('test error')
  expect(prettyError.stack).toContain('Test.test.ts:1:1')
  expect(prettyError.stack).not.toContain('/test/e2e')
})

test('prepare - resolves relative stack paths against root when generating code frames', async () => {
  // @ts-ignore
  FileSystem.readFileSync.mockImplementation(() => {
    return `import test from 'node:test'

test('example', () => {
  throw new Error('boom')
})
`
  })
  // @ts-ignore
  FileSystem.existsSync.mockImplementation((path: string) => {
    return path === '/repo/.vscode-test-workspace/test/add.test.js'
  })
  const error = new ExpectError('test error')
  error.stack = `ExpectError: test error
    at Object.<anonymous> (test/add.test.js:3:3)`

  const prettyError = await PrettyError.prepare(error, { color: false, root: '/repo/packages/e2e' })

  expect(prettyError.codeFrame).toContain("throw new Error('boom')")
  expect(FileSystem.readFileSync).toHaveBeenCalledWith('/repo/.vscode-test-workspace/test/add.test.js', 'utf8')
})

test('prepare - ignores node internal undici stack frame for code frame path resolution', async () => {
  // @ts-ignore
  FileSystem.readFileSync.mockImplementation(() => {
    return `export const read = () => {
  throw new Error('boom')
}
`
  })
  const error = new ExpectError('test error')
  error.stack = `ExpectError: test error
    at getResponse (node:internal/deps/undici/undici:321:109)
    at Object.<anonymous> (/repo/packages/launch-worker/src/parts/RestoreUserDataDir/RestoreUserDataDir.ts:2:9)`

  const prettyError = await PrettyError.prepare(error, { color: false })

  expect(prettyError.codeFrame).toContain("throw new Error('boom')")
  expect(FileSystem.readFileSync).toHaveBeenCalledWith(
    '/repo/packages/launch-worker/src/parts/RestoreUserDataDir/RestoreUserDataDir.ts',
    'utf8',
  )
  expect(warnSpy).not.toHaveBeenCalled()
})

test('prepare - resolves Windows-style relative stack paths against root when generating code frames', async () => {
  // @ts-ignore
  FileSystem.readFileSync.mockImplementation(() => {
    return `import test from 'node:test'

test('example', () => {
  throw new Error('boom')
})
`
  })
  // @ts-ignore
  FileSystem.existsSync.mockImplementation((path: string) => {
    return path === 'C:/repo/.vscode-test-workspace/test/add.test.js'
  })
  const error = new ExpectError('test error')
  error.stack = `ExpectError: test error
    at Object.<anonymous> (test\\add.test.js:3:3)`

  const prettyError = await PrettyError.prepare(error, { color: false, root: 'C:\\repo\\packages\\e2e' })

  expect(prettyError.codeFrame).toContain("throw new Error('boom')")
  expect(FileSystem.readFileSync).toHaveBeenCalledWith('C:/repo/.vscode-test-workspace/test/add.test.js', 'utf8')
})

test('prepare - module not found error', async () => {
  mockReadFileSync.mockImplementation(() => {
    return `import { test } from 'missing-package'
`
  })
  const error = new Error("Cannot find package 'missing-package' imported from /test/e2e/Test.test.ts")
  // @ts-ignore
  error.code = 'ERR_MODULE_NOT_FOUND'
  error.stack = `Error: Cannot find package 'missing-package' imported from /test/e2e/Test.test.ts
    at Object.<anonymous> (/test/e2e/Test.test.ts:1:1)`
  const prettyError = await PrettyError.prepare(error, { color: false, root: '/test/e2e' })
  expect(prettyError.message).toContain('missing-package')
  expect(prettyError.codeFrame).toBeTruthy()
  expect(prettyError.stack).toContain('Test.test.ts')
  expect(mockReadFileSync).toHaveBeenCalledWith('/test/e2e/Test.test.ts', 'utf-8')
})

test('prepare - error with codeFrame already set', async () => {
  const error = new ExpectError('test error')
  error.stack = `ExpectError: test error
    at Object.<anonymous> (/test/e2e/Test.test.ts:1:1)`
  // @ts-ignore
  error.codeFrame = '  1 | const x = 1\n> 2 | const y = x\n    |           ^'
  const prettyError = await PrettyError.prepare(error, { color: false, root: '/test/e2e' })
  expect(prettyError.codeFrame).toBe('  1 | const x = 1\n> 2 | const y = x\n    |           ^')
  expect(prettyError.message).toBe('test error')
})

test('prepare - error with cause', async () => {
  // @ts-ignore
  FileSystem.readFileSync.mockImplementation(() => {
    return `export const watch = ['']
`
  })
  const causeError = new Error('cause error')
  causeError.stack = `Error: cause error
    at Object.<anonymous> (/test/e2e/Test.test.ts:2:2)`
  const error = new ExpectError('test error')
  error.stack = `ExpectError: test error
    at Object.<anonymous> (/test/e2e/Test.test.ts:1:1)`
  // @ts-ignore
  error.cause = () => causeError
  const prettyError = await PrettyError.prepare(error, { color: false, root: '/test/e2e' })
  expect(prettyError.message).toBe('test error')
  expect(prettyError.stack).toContain('Test.test.ts:2:2')
})

test('prepare - error type is preserved', async () => {
  // @ts-ignore
  FileSystem.readFileSync.mockImplementation(() => {
    return `export const watch = ['']
`
  })
  const error = new ExpectError('test error')
  error.stack = `ExpectError: test error
    at Object.<anonymous> (/test/e2e/Test.test.ts:1:1)`
  const prettyError = await PrettyError.prepare(error, { color: false })
  expect(prettyError.type).toBe('ExpectError')
})
