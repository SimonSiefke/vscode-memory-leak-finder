import { expect, test, jest, beforeEach } from '@jest/globals'

const mockStdin = {
  setRawMode: jest.fn(),
  resume: jest.fn(),
  pause: jest.fn(),
  setEncoding: jest.fn(),
}

jest.unstable_mockModule('../src/parts/Process/Process.ts', () => ({
  stdin: mockStdin,
}))

const Stdin = await import('../src/parts/Stdin/Stdin.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('setRawMode calls Process.stdin.setRawMode with true', () => {
  Stdin.setRawMode(true)
  expect(mockStdin.setRawMode).toHaveBeenCalledTimes(1)
  expect(mockStdin.setRawMode).toHaveBeenCalledWith(true)
})

test('setRawMode calls Process.stdin.setRawMode with false', () => {
  Stdin.setRawMode(false)
  expect(mockStdin.setRawMode).toHaveBeenCalledTimes(1)
  expect(mockStdin.setRawMode).toHaveBeenCalledWith(false)
})

test('resume calls Process.stdin.resume', () => {
  Stdin.resume()
  expect(mockStdin.resume).toHaveBeenCalledTimes(1)
  expect(mockStdin.resume).toHaveBeenCalled()
})

test('pause calls Process.stdin.pause', () => {
  Stdin.pause()
  expect(mockStdin.pause).toHaveBeenCalledTimes(1)
  expect(mockStdin.pause).toHaveBeenCalled()
})

test('setEncoding calls Process.stdin.setEncoding with utf8', () => {
  Stdin.setEncoding('utf8')
  expect(mockStdin.setEncoding).toHaveBeenCalledTimes(1)
  expect(mockStdin.setEncoding).toHaveBeenCalledWith('utf8')
})

test('setEncoding calls Process.stdin.setEncoding with ascii', () => {
  Stdin.setEncoding('ascii')
  expect(mockStdin.setEncoding).toHaveBeenCalledTimes(1)
  expect(mockStdin.setEncoding).toHaveBeenCalledWith('ascii')
})

test('setEncoding calls Process.stdin.setEncoding with utf16le', () => {
  Stdin.setEncoding('utf16le')
  expect(mockStdin.setEncoding).toHaveBeenCalledTimes(1)
  expect(mockStdin.setEncoding).toHaveBeenCalledWith('utf16le')
})

test('setEncoding calls Process.stdin.setEncoding with null', () => {
  Stdin.setEncoding(null)
  expect(mockStdin.setEncoding).toHaveBeenCalledTimes(1)
  expect(mockStdin.setEncoding).toHaveBeenCalledWith(null)
})

test('setEncoding calls Process.stdin.setEncoding with undefined', () => {
  Stdin.setEncoding(undefined)
  expect(mockStdin.setEncoding).toHaveBeenCalledTimes(1)
  expect(mockStdin.setEncoding).toHaveBeenCalledWith(undefined)
})
