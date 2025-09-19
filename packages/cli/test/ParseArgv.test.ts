import { expect, test } from '@jest/globals'
import * as ParseArgv from '../src/parts/ParseArgv/ParseArgv.ts'

test('parseArgv - empty', () => {
  const argv = []
  expect(ParseArgv.parseArgv(argv)).toMatchObject({})
})

test('parseArgv - watch mode', () => {
  const argv = ['--watch']
  expect(ParseArgv.parseArgv(argv)).toMatchObject({
    watch: true,
  })
})

test('parseArgv - headless mode', () => {
  const argv = ['--headless']
  expect(ParseArgv.parseArgv(argv)).toMatchObject({
    headless: true,
  })
})

test('parseArgv - run skipped tests anyway', () => {
  const argv = ['--run-skipped-tests-anyway']
  expect(ParseArgv.parseArgv(argv)).toMatchObject({
    runSkippedTestsAnyway: true,
  })
})

test('parseArgv - runs', () => {
  const argv = ['--runs', '4']
  expect(ParseArgv.parseArgv(argv)).toMatchObject({
    runs: 4,
  })
})

test('parseArgv - runs', () => {
  const argv = ['--runs', '4']
  expect(ParseArgv.parseArgv(argv)).toMatchObject({
    runs: 4,
  })
})

test('parseArgv - record video', () => {
  const argv = ['--record-video']
  expect(ParseArgv.parseArgv(argv)).toMatchObject({
    recordVideo: true,
  })
})

test('parseArgv - cwd', () => {
  const argv = ['--cwd', '/test']
  expect(ParseArgv.parseArgv(argv)).toMatchObject({
    cwd: '/test',
  })
})

test('parseArgv - vscode-path flag', () => {
  const argv = ['--vscode-path', '/path/to/vscode']
  const options = ParseArgv.parseArgv(argv)
  expect(options.vscodePath).toBe('/path/to/vscode')
})

test('parseArgv - vscode-path flag empty', () => {
  const argv = ['--vscode-path', '']
  const options = ParseArgv.parseArgv(argv)
  expect(options.vscodePath).toBe('')
})

test('parseArgv - vscode-path flag not present', () => {
  const argv = []
  const options = ParseArgv.parseArgv(argv)
  expect(options.vscodePath).toBe('')
})

test('parseArgv - commit flag', () => {
  const argv = ['--commit', 'abc123']
  const options = ParseArgv.parseArgv(argv)
  expect(options.commit).toBe('abc123')
})

test('parseArgv - commit flag empty', () => {
  const argv = ['--commit', '']
  const options = ParseArgv.parseArgv(argv)
  expect(options.commit).toBe('')
})

test('parseArgv - commit flag not present', () => {
  const argv = []
  const options = ParseArgv.parseArgv(argv)
  expect(options.commit).toBe('')
})

test('parseArgv - setup-only flag', () => {
  const argv = ['--setup-only']
  const options = ParseArgv.parseArgv(argv)
  expect(options.setupOnly).toBe(true)
})

test('parseArgv - setup-only flag not present', () => {
  const argv = []
  const options = ParseArgv.parseArgv(argv)
  expect(options.setupOnly).toBe(false)
})

test('parseArgv - measure-node flag', () => {
  const argv = ['--measure-node']
  const options = ParseArgv.parseArgv(argv)
  expect(options.measureNode).toBe(true)
})

test('parseArgv - measure-node flag sets measureNode to true', () => {
  const argv = ['--measure-node']
  const options = ParseArgv.parseArgv(argv)
  expect(options.measureNode).toBe(true)
})

test('parseArgv - measure-node flag with other options', () => {
  const argv = ['--measure-node', '--measure', 'namedFunctionCount3', '--check-leaks']
  const options = ParseArgv.parseArgv(argv)
  expect(options.measureNode).toBe(true)
  expect(options.measure).toBe('namedFunctionCount3')
  expect(options.checkLeaks).toBe(true)
})

test('parseArgv - measureNode defaults to false', () => {
  const argv = ['--measure', 'event-listener-count']
  const options = ParseArgv.parseArgv(argv)
  expect(options.measureNode).toBe(false)
})
