import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/ExecFile/ExecFile.ts', () => {
  return {
    execFilePromise: jest.fn(),
  }
})

const ExecFile = await import('../src/parts/ExecFile/ExecFile.ts')
const CallgrindControl = await import('../src/parts/CallgrindControl/CallgrindControl.ts')

test('callgrindControl - start', async () => {
  await CallgrindControl.start({
    spoolDir: '/tmp/spool',
    vgdbPrefix: 'vmlf-callgrind-test',
  })
  expect(ExecFile.execFilePromise).toHaveBeenCalledWith('callgrind_control', ['--vgdb-prefix=vmlf-callgrind-test', '--zero', '--instr=on'])
})

test('callgrindControl - stop', async () => {
  await CallgrindControl.stop({
    spoolDir: '/tmp/spool',
    vgdbPrefix: 'vmlf-callgrind-test',
  })
  expect(ExecFile.execFilePromise).toHaveBeenCalledWith('callgrind_control', [
    '--vgdb-prefix=vmlf-callgrind-test',
    '--instr=off',
    '--dump=vmlf-measure',
  ])
})
