import * as ParseArgv from '../src/parts/ParseArgv/ParseArgv.js'

test('parseArgv - empty', () => {
  const argv = []
  expect(ParseArgv.parseArgv(argv)).toEqual({
    watch: false,
    headless: false,
  })
})

test('parseArgv - watch mode', () => {
  const argv = ['--watch']
  expect(ParseArgv.parseArgv(argv)).toEqual({
    watch: true,
    headless: false,
  })
})

test('parseArgv - headless mode', () => {
  const argv = ['--headless']
  expect(ParseArgv.parseArgv(argv)).toEqual({
    watch: false,
    headless: true,
  })
})
