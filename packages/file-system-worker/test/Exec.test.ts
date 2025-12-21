import { expect, test, jest } from '@jest/globals'

const mockExeca = jest.fn(async () => ({ exitCode: 0, stderr: '', stdout: '' }))

jest.unstable_mockModule('execa', () => ({
  execa: mockExeca,
}))

const { exec } = await import('../src/parts/Exec/Exec.ts')

test('exec returns stdout, stderr, and exitCode', async () => {
  const command = 'echo'
  const args = ['hello']
  const options = { cwd: '/test/dir' }
  const mockResult = {
    exitCode: 0,
    stderr: '',
    stdout: 'hello\n',
  }

  mockExeca.mockResolvedValue(mockResult)

  const result = await exec(command, args, options)

  expect(result).toEqual({
    exitCode: 0,
    stderr: '',
    stdout: 'hello\n',
  })
  // @ts-ignore
  expect(mockExeca).toHaveBeenCalledWith(command, args, options)
})

test('exec handles empty stdout and stderr', async () => {
  const command = 'test'
  const args = []
  const mockResult = {
    exitCode: 1,
    stderr: '',
    stdout: '',
  }

  mockExeca.mockResolvedValue(mockResult)

  const result = await exec(command, args)

  expect(result).toEqual({
    exitCode: 1,
    stderr: '',
    stdout: '',
  })
})

test('exec uses default options when not provided', async () => {
  const command = 'ls'
  const args = ['-la']
  const mockResult = {
    exitCode: 0,
    stderr: '',
    stdout: 'file1.txt\nfile2.txt\n',
  }

  mockExeca.mockResolvedValue(mockResult)

  await exec(command, args)

  // @ts-ignore
  expect(mockExeca).toHaveBeenCalledWith(command, args, {})
})

test('exec handles non-zero exit code', async () => {
  const command = 'false'
  const args = []
  const mockResult = {
    exitCode: 1,
    stderr: 'Command failed',
    stdout: '',
  }

  mockExeca.mockResolvedValue(mockResult)

  const result = await exec(command, args)

  expect(result).toEqual({
    exitCode: 1,
    stderr: 'Command failed',
    stdout: '',
  })
})
