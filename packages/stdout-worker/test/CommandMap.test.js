import { expect, test, jest } from '@jest/globals'

const mockStdout = {
  write: jest.fn(),
}

const mockStdin = {
  setRawMode: jest.fn(),
  resume: jest.fn(),
  pause: jest.fn(),
  setEncoding: jest.fn(),
}

jest.unstable_mockModule('../src/parts/Stdout/Stdout.js', () => ({
  write: mockStdout.write,
}))

jest.unstable_mockModule('../src/parts/Stdin/Stdin.js', () => ({
  setRawMode: mockStdin.setRawMode,
  resume: mockStdin.resume,
  pause: mockStdin.pause,
  setEncoding: mockStdin.setEncoding,
}))

const CommandMap = await import('../src/parts/CommandMap/CommandMap.js')

test('commandMap contains Stdout.write function', () => {
  expect(CommandMap.commandMap['Stdout.write']).toBe(mockStdout.write)
})

test('commandMap contains Stdin.setRawMode function', () => {
  expect(CommandMap.commandMap['Stdin.setRawMode']).toBe(mockStdin.setRawMode)
})

test('commandMap contains Stdin.resume function', () => {
  expect(CommandMap.commandMap['Stdin.resume']).toBe(mockStdin.resume)
})

test('commandMap contains Stdin.pause function', () => {
  expect(CommandMap.commandMap['Stdin.pause']).toBe(mockStdin.pause)
})

test('commandMap contains Stdin.setEncoding function', () => {
  expect(CommandMap.commandMap['Stdin.setEncoding']).toBe(mockStdin.setEncoding)
})

test('commandMap has correct number of entries', () => {
  expect(Object.keys(CommandMap.commandMap)).toHaveLength(5)
})

test('commandMap contains all expected keys', () => {
  const expectedKeys = ['Stdout.write', 'Stdin.setRawMode', 'Stdin.resume', 'Stdin.pause', 'Stdin.setEncoding']
  expect(Object.keys(CommandMap.commandMap)).toEqual(expect.arrayContaining(expectedKeys))
})
