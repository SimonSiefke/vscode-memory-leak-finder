import { expect, test } from '@jest/globals'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import {
  createProcessTreeSampler,
  getProcessTable,
  readProcessPssKiB,
  updateTrackedProcesses,
} from '../src/parts/LinuxProcessTreeResources/LinuxProcessTreeResources.ts'

const linuxTest = process.platform === 'linux' ? test : test.skip

linuxTest(
  'sums real PSS across a parent and child process',
  async () => {
    const childProgram = `
      const memory = Buffer.alloc(64 * 1024 * 1024)
      for (let index = 0; index < memory.length; index += 4096) memory[index] = 1
      process.stdout.write('ready\\n')
      setInterval(() => {}, 1000)
    `
    const parentProgram = `
      const { spawn } = require('node:child_process')
      const memory = Buffer.alloc(32 * 1024 * 1024)
      for (let index = 0; index < memory.length; index += 4096) memory[index] = 1
      const child = spawn(process.execPath, ['-e', ${JSON.stringify(childProgram)}], { stdio: ['ignore', 'pipe', 'ignore'] })
      child.stdout.once('data', () => process.stdout.write('ready\\n'))
      setInterval(() => {}, 1000)
    `
    const parent = spawn(process.execPath, ['-e', parentProgram], { stdio: ['ignore', 'pipe', 'ignore'] })
    const trackedPids: number[] = []
    try {
      await once(parent.stdout!, 'data')
      const table = await getProcessTable()
      const tracked = updateTrackedProcesses(parent.pid!, new Map(), table)
      trackedPids.push(...tracked.keys())
      expect(trackedPids.length).toBeGreaterThanOrEqual(2)
      const individualPss = await Promise.all(trackedPids.map((pid) => readProcessPssKiB(pid)))
      const sampler = createProcessTreeSampler(parent.pid!, {}, { intervalMs: 10_000 })
      const first = await sampler.start()
      await sampler.stop()
      expect(first.processCount).toBe(trackedPids.length)
      expect(Math.abs(first.pssKiB - individualPss.reduce((total, value) => total + value, 0))).toBeLessThan(1024)
      expect(first.pssKiB).toBeGreaterThan(Math.max(...individualPss))
    } finally {
      for (const pid of trackedPids.toReversed()) {
        try {
          process.kill(pid, 'SIGKILL')
        } catch {
          // The process already exited.
        }
      }
      if (parent.exitCode === null) {
        parent.kill('SIGKILL')
      }
      await once(parent, 'close').catch(() => undefined)
    }
  },
  15_000,
)
