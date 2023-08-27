import * as ParseArgv from '../src/parts/ParseArgv/ParseArgv.js'

test('parseArgv - empty', () => {
  const argv = []
  expect(ParseArgv.parseArgv(argv)).toEqual({
    watch: false,
    headless: false,
    checkLeaks: false,
    runs: 1,
  })
})

test('parseArgv - watch mode', () => {
  const argv = ['--watch']
  expect(ParseArgv.parseArgv(argv)).toEqual({
    watch: true,
    headless: false,
    checkLeaks: false,
    runs: 1,
  })
})

test('parseArgv - headless mode', () => {
  const argv = ['--headless']
  expect(ParseArgv.parseArgv(argv)).toEqual({
    watch: false,
    headless: true,
    checkLeaks: false,
    runs: 1,
  })
})

test('parseArgv - runs', () => {
  const argv = ['--runs', '4']
  expect(ParseArgv.parseArgv(argv)).toEqual({
    watch: false,
    headless: false,
    checkLeaks: false,
    runs: 4,
  })
})
