import { expect, test } from '@jest/globals'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import * as Client from '../src/parts/Client/Client.ts'
import { PerfEvents } from '../src/parts/LinuxProcessTreeResources/LinuxProcessTreeResources.ts'

const linuxTest = process.platform === 'linux' ? test : test.skip

linuxTest(
  'returns parsed scenario data and disposes the worker after stop',
  async () => {
    const target = spawn(
      process.execPath,
      [
        '-e',
        'const value = Buffer.alloc(16 * 1024 * 1024, 1); function work() { for (let i = 0; i < 1e6; i++) value[i % value.length] ^= i; setImmediate(work) } work()',
      ],
      { stdio: 'ignore' },
    )
    let handle: Client.MeasurementHandle | undefined
    try {
      handle = await Client.start(target.pid!, { window: 'scenario' })
      process.kill(handle.workerPid, 0)
      await setTimeout(500)
      const { outputDirectory, workerPid } = handle
      const result = await Client.stop(handle)
      handle = undefined
      expect(result.window).toBe('scenario')
      expect(result.cpu.durationSeconds).toBeGreaterThan(0)
      expect(result.memory.startingPssMiB).toBeGreaterThan(0)
      expect(result.sampling.validSampleCount).toBeGreaterThanOrEqual(2)
      expect(() => process.kill(workerPid, 0)).toThrow()
      await expect(stat(outputDirectory)).rejects.toMatchObject({ code: 'ENOENT' })
    } finally {
      if (handle) {
        const { outputDirectory, workerPid } = handle
        await Client.dispose(handle)
        expect(() => process.kill(workerPid, 0)).toThrow()
        await expect(stat(outputDirectory)).rejects.toMatchObject({ code: 'ENOENT' })
      }
      if (target.exitCode === null) {
        target.kill('SIGKILL')
      }
      await once(target, 'close').catch(() => undefined)
    }
  },
  15_000,
)

linuxTest(
  'stops a from-start worker through a serialized handle',
  async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'vmlf-linux-process-tree-from-start-test-'))
    const perfOutputPath = join(outputDirectory, 'perf.txt')
    const workload =
      'const value = Buffer.alloc(16 * 1024 * 1024, 1); function work() { for (let i = 0; i < 1e6; i++) value[i % value.length] ^= i; setImmediate(work) } work()'
    const perf = spawn(
      'perf',
      [
        'stat',
        '--no-big-num',
        '-x',
        ',',
        '-I',
        '100',
        '-e',
        PerfEvents.join(','),
        '-o',
        perfOutputPath,
        '--',
        process.execPath,
        '-e',
        workload,
      ],
      { detached: true, stdio: 'ignore' },
    )
    let handle: Client.MeasurementHandle | undefined
    try {
      await once(perf, 'spawn')
      handle = await Client.start(perf.pid!, { perfOutputPath, window: 'fromStart' })
      await setTimeout(500)
      const transferredHandle = JSON.parse(JSON.stringify(handle)) as Client.MeasurementHandle
      const { outputDirectory: workerOutputDirectory, workerPid } = transferredHandle
      const result = await Client.stop(transferredHandle)
      handle = undefined
      expect(result.window).toBe('fromStart')
      expect(result.cpu.durationSeconds).toBeGreaterThan(0)
      expect(result.memory.startingPssMiB).toBeGreaterThan(0)
      expect(() => process.kill(workerPid, 0)).toThrow()
      await expect(stat(workerOutputDirectory)).rejects.toMatchObject({ code: 'ENOENT' })
    } finally {
      if (handle) {
        await Client.dispose(handle)
      }
      if (perf.pid !== undefined) {
        try {
          process.kill(-perf.pid, 'SIGKILL')
        } catch {
          // The process group already exited.
        }
      }
      await once(perf, 'close').catch(() => undefined)
      await rm(outputDirectory, { force: true, recursive: true })
    }
  },
  15_000,
)
