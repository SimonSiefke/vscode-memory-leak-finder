import { expect, jest, test } from '@jest/globals'
import { createMockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { ensureNestedDependencies, installDependencies } from '../src/parts/InstallDependencies/InstallDependencies.ts'
import { runMinifiedBuild } from '../src/parts/RunCompile/RunCompile.ts'

test.each([false, true])('installs a pnpm revision with its pinned manager (nice=%s)', async (useNice) => {
  const cwd = '/test/vscode'
  const rpc = createMockRpc({
    commandMap: {
      'FileSystem.exists': (path: string) =>
        path === `${cwd}/pnpm-lock.yaml` || path.endsWith('/.nvmrc') || /\/bin\/(node|npm)$/.test(path),
      'FileSystem.readFileContent': (path: string) => {
        if (path.endsWith('/.nvmrc')) {
          return '24.22.2'
        }
        if (path === `${cwd}/package.json`) {
          return JSON.stringify({ packageManager: 'pnpm@12.16.0' })
        }
        throw new Error(`Unexpected read: ${path}`)
      },
      'FileSystem.exec': () => ({ exitCode: 0, stdout: '', stderr: '' }),
      'FileSystem.findFiles': () => [],
    },
  })
  FileSystemWorker.set(rpc)

  await installDependencies(cwd, useNice)

  const calls = rpc.invocations.filter(([method]) => method === 'FileSystem.exec')
  expect(calls.map(([, command, args]) => [command, args])).toEqual([
    [
      useNice ? 'nice' : expect.stringMatching(/\/bin\/npm$/),
      [
        ...(useNice ? ['-n', '10', expect.stringMatching(/\/bin\/npm$/)] : []),
        'exec',
        '--yes',
        '--package=pnpm@12.16.0',
        '--',
        'pnpm',
        'install',
        '--frozen-lockfile',
      ],
    ],
  ])
  const options = calls[0][3] as { cwd: string; env: Record<string, string>; reject: boolean }
  expect(options.cwd).toBe(cwd)
  expect(options.reject).toBe(false)
  expect(options.env.pnpm_config_frozen_lockfile).toBe('true')
  expect(options.env.PATH).toContain('/versions/node/v24.22.2/bin:')
  expect(rpc.invocations.some(([method]) => method === 'FileSystem.findFiles')).toBe(false)
})

test('does not run npm installs for nested roots owned by pnpm postinstall', async () => {
  const rpc = createMockRpc({ commandMap: { 'FileSystem.exists': () => true } })
  FileSystemWorker.set(rpc)
  await expect(ensureNestedDependencies('/test/vscode', false)).resolves.toBe(0)
  expect(rpc.invocations).toHaveLength(1)
})

test.each([false, true])('minified builds make pinned pnpm available to build scripts (nice=%s)', async (useNice) => {
  const rpc = createMockRpc({
    commandMap: {
      'FileSystem.exists': () => true,
      'FileSystem.readFileContent': (path: string) =>
        path.endsWith('/.nvmrc') ? '24.22.2' : JSON.stringify({ packageManager: 'pnpm@12.16.0' }),
      'FileSystem.exec': () => ({ exitCode: 0, stdout: '', stderr: '' }),
    },
  })
  FileSystemWorker.set(rpc)
  await runMinifiedBuild('/test/vscode', 'linux', 'arm64', useNice, '/test/code-oss')
  const calls = rpc.invocations.filter(([method]) => method === 'FileSystem.exec')
  expect(calls.map(([, command, args]) => [command, args])).toEqual([
    [
      useNice ? 'nice' : expect.stringMatching(/\/bin\/npm$/),
      [
        ...(useNice ? ['-n', '10', expect.stringMatching(/\/bin\/npm$/)] : []),
        'exec',
        '--yes',
        '--package=pnpm@12.16.0',
        '--',
        'pnpm',
        'run',
        'gulp',
        'vscode-linux-arm64-min',
      ],
    ],
  ])
})

test('pnpm install failures preserve the selected command and stderr after retries', async () => {
  const rpc = createMockRpc({
    commandMap: {
      'FileSystem.exists': () => true,
      'FileSystem.readFileContent': (path: string) =>
        path.endsWith('/.nvmrc') ? '24.22.2' : JSON.stringify({ packageManager: 'pnpm@12.16.0' }),
      'FileSystem.exec': () => ({ exitCode: 1, stdout: '', stderr: 'ERR_PNPM_OUTDATED_LOCKFILE' }),
    },
  })
  FileSystemWorker.set(rpc)
  jest.useFakeTimers()
  const log = jest.spyOn(console, 'log').mockImplementation(() => {})
  try {
    const failure = installDependencies('/test/vscode', false).catch((error: Error) => error)
    await jest.advanceTimersByTimeAsync(4000)
    const error = await failure
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain('pnpm install failed')
    expect((error as Error).message).toContain('after 3 attempts')
    expect((error as Error).message).toContain('--package=pnpm@12.16.0')
    expect((error as Error).message).toContain('ERR_PNPM_OUTDATED_LOCKFILE')
  } finally {
    log.mockRestore()
    jest.useRealTimers()
  }
})

test.each([undefined, 'pnpm@latest', 'npm@11.0.0'])('rejects an unpinned pnpm manager (%s)', async (packageManager) => {
  const rpc = createMockRpc({
    commandMap: {
      'FileSystem.exists': () => true,
      'FileSystem.readFileContent': () => JSON.stringify({ packageManager }),
    },
  })
  FileSystemWorker.set(rpc)
  await expect(installDependencies('/test/vscode', false)).rejects.toThrow('Expected a pinned pnpm version')
})
