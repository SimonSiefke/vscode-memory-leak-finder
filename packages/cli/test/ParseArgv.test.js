import { expect, test } from '@jest/globals'
import * as ParseArgv from '../src/parts/ParseArgv/ParseArgv.js'

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
