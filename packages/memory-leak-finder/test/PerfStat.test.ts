import { expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'

const mockSpawn = jest.fn()

jest.unstable_mockModule('node:child_process', () => {
  return {
    spawn: mockSpawn,
  }
})

const PerfStat = await import('../src/parts/PerfStat/PerfStat.ts')

class MockChildProcess extends EventEmitter {
  stderr = new PassThrough()
  exitCode = null
  killed = false
  pid = 123
  kill = jest.fn()
}

test('startPerfStat handles missing perf program', async () => {
  const childProcess = new MockChildProcess()
  mockSpawn.mockReturnValue(childProcess)

  const startPromise = PerfStat.startPerfStat(338_272)
  queueMicrotask(() => {
    childProcess.emit(
      'error',
      Object.assign(new Error('spawn perf ENOENT'), {
        code: 'ENOENT',
        errno: -2,
        syscall: 'spawn perf',
        path: 'perf',
      }),
    )
  })

  await expect(startPromise).rejects.toThrow(
    'The perf program is not available. Install it with: sudo apt install linux-tools-common linux-tools-generic linux-tools-$(uname -r)',
  )
  expect(mockSpawn).toHaveBeenCalledWith('perf', PerfStat.getPerfStatArgs(338_272), {
    stdio: ['ignore', 'ignore', 'pipe'],
  })
})
