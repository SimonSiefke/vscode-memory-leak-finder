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
