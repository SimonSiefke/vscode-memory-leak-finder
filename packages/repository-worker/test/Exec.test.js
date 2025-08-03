import { expect, test, jest } from '@jest/globals'

const mockExeca = jest.fn()

jest.unstable_mockModule('execa', () => ({
  execa: mockExeca,
}))

const { exec } = await import('../src/parts/Exec/Exec.js')

test('exec returns stdout, stderr, and exitCode', async () => {
  const command = 'echo'
  const args = ['hello']
  const options = { cwd: '/test/dir' }
  const mockResult = {
    stdout: 'hello\n',
    stderr: '',
    exitCode: 0,
  }

  mockExeca.mockResolvedValue(mockResult)

  const result = await exec(command, args, options)

  expect(result).toEqual({
    stdout: 'hello\n',
    stderr: '',
    exitCode: 0,
  })
  expect(mockExeca).toHaveBeenCalledWith(command, args, options)
})

test('exec handles empty stdout and stderr', async () => {
  const command = 'test'
  const args = []
  const mockResult = {
    stdout: null,
    stderr: null,
    exitCode: 1,
  }

  mockExeca.mockResolvedValue(mockResult)

  const result = await exec(command, args)

  expect(result).toEqual({
    stdout: '',
    stderr: '',
    exitCode: 1,
  })
})

test('exec uses default options when not provided', async () => {
  const command = 'ls'
  const args = ['-la']
  const mockResult = {
    stdout: 'file1.txt\nfile2.txt\n',
    stderr: '',
    exitCode: 0,
  }

  mockExeca.mockResolvedValue(mockResult)

  await exec(command, args)

  expect(mockExeca).toHaveBeenCalledWith(command, args, {})
})

test('exec handles non-zero exit code', async () => {
  const command = 'false'
  const args = []
  const mockResult = {
    stdout: '',
    stderr: 'Command failed',
    exitCode: 1,
  }

  mockExeca.mockResolvedValue(mockResult)

  const result = await exec(command, args)

  expect(result).toEqual({
    stdout: '',
    stderr: 'Command failed',
    exitCode: 1,
  })
}) 