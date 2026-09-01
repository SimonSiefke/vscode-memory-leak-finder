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
    'The perf program is not available. Install it with: sudo apt install -y linux-tools-common linux-tools-generic linux-tools-$(uname -r)',
  )
  expect(mockSpawn).toHaveBeenCalledWith('perf', PerfStat.getPerfStatArgs(338_272), {
    stdio: ['ignore', 'ignore', 'pipe'],
  })
})

test('Linux process-tree perf stat attaches to every current process and keeps inheritance enabled', () => {
  const args = PerfStat.getLinuxProcessTreePerfStatArgs([10, 20])
  expect(args).toEqual([
    'stat',
    '--no-big-num',
    '-x',
    ',',
    '-e',
    'duration_time,user_time,system_time,task-clock,instructions:u,cycles:u,context-switches,cpu-migrations,page-faults,minor-faults,major-faults',
    '-p',
    '10,20',
  ])
  expect(args).not.toContain('--no-inherit')
})
