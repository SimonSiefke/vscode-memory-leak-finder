import { test, expect } from '@jest/globals'
import * as ParseArgv from '../src/parts/ParseArgv/ParseArgv.ts'

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
