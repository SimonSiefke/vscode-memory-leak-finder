import { expect, test, jest } from '@jest/globals'

const mockExec = jest.fn(async () => ({ stdout: '', stderr: '', exitCode: 0 }))
const mockPathExists = jest.fn(async () => true)
const mockLogger = jest.fn()

jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
  exec: mockExec,
}))

jest.unstable_mockModule('path-exists', () => ({
  pathExists: mockPathExists,
}))

jest.unstable_mockModule('../src/parts/Logger/Logger.ts', () => ({
  log: mockLogger,
}))

const { runCompile } = await import('../src/parts/RunCompile/RunCompile.ts')

test('runCompile executes npm run compile without nice', async () => {
  const cwd = '/test/repo'
  const useNice = false
  const mainJsPath = '/test/repo/out/main.ts'

  mockExec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

  mockPathExists.mockResolvedValue(true)

  await runCompile(cwd, useNice, mainJsPath)

  // @ts-ignore
  expect(mockExec).toHaveBeenCalledWith('npm', ['run', 'compile'], { cwd })
  // @ts-ignore
  expect(mockPathExists).toHaveBeenCalledWith(mainJsPath)
})

test('runCompile executes npm run compile with nice', async () => {
  const cwd = '/test/repo'
  const useNice = true
  const mainJsPath = '/test/repo/out/main.ts'

  mockExec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

  mockPathExists.mockResolvedValue(true)

  await runCompile(cwd, useNice, mainJsPath)

  // @ts-ignore
  expect(mockExec).toHaveBeenCalledWith('nice', ['-n', '10', 'npm', 'run', 'compile'], { cwd })
  // @ts-ignore
  expect(mockPathExists).toHaveBeenCalledWith(mainJsPath)
})

test('runCompile throws error when main.js not found after compilation', async () => {
  const cwd = '/test/repo'
  const useNice = false
  const mainJsPath = '/test/repo/out/main.ts'

  mockExec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

  mockPathExists.mockResolvedValue(false)

  await expect(runCompile(cwd, useNice, mainJsPath)).rejects.toThrow('Build failed: out/main.js not found after compilation')
})

test('runCompile logs when using nice', async () => {
  const cwd = '/test/repo'
  const useNice = true
  const mainJsPath = '/test/repo/out/main.ts'

  mockExec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

  mockPathExists.mockResolvedValue(true)

  await runCompile(cwd, useNice, mainJsPath)
})
