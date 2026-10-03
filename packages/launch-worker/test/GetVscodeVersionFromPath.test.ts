import { afterEach, expect, jest, test } from '@jest/globals'

const spawnSync = jest.fn()

jest.unstable_mockModule('node:child_process', () => {
  return {
    spawnSync,
  }
})

afterEach(() => {
  jest.resetAllMocks()
})

test('getVscodeVersionFromPath - reads the first line from stdout', async () => {
  spawnSync.mockReturnValue({
    pid: 1,
    output: [],
    stdout: '1.130.0\nabcdef\n',
    stderr: '',
    status: 0,
    signal: null,
  })

  const { getVscodeVersionFromPath } = await import('../src/parts/GetVscodeVersionFromPath/GetVscodeVersionFromPath.ts')
  const result = getVscodeVersionFromPath('/home/simon/.cache/repos/vscode/scripts/code.sh')

  expect(result).toBe('1.130.0')
  expect(spawnSync).toHaveBeenCalledWith('/home/simon/.cache/repos/vscode/scripts/code.sh', ['--version'], {
    encoding: 'utf8',
  })
})

test('getVscodeVersionFromPath - returns empty string on failure', async () => {
  spawnSync.mockReturnValue({
    pid: 1,
    output: [],
    stdout: '',
    stderr: 'boom',
    status: 1,
    signal: null,
  })

  const { getVscodeVersionFromPath } = await import('../src/parts/GetVscodeVersionFromPath/GetVscodeVersionFromPath.ts')
  const result = getVscodeVersionFromPath('/home/simon/.cache/repos/vscode/scripts/code.sh')

  expect(result).toBe('')
})
