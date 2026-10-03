import { expect, test } from '@jest/globals'
import {
  createProcessTreeSampler,
  parsePerfStatOutput,
  parseProcessStat,
  parseSmapsRollupPssKiB,
  updateTrackedProcesses,
  type ProcessIdentity,
} from '../src/parts/LinuxProcessTreeResources/LinuxProcessTreeResources.ts'
import * as LinuxProcessTreeResourceResult from '../src/parts/LinuxProcessTreeResources/LinuxProcessTreeResourceResult.ts'

const processIdentity = (pid: number, parentPid: number, startTimeTicks = `${pid}`): ProcessIdentity => ({
  parentPid,
  pid,
  startTimeTicks,
})

const processTable = (...processes: readonly ProcessIdentity[]): ReadonlyMap<number, ProcessIdentity> => {
  return new Map(processes.map((process) => [process.pid, process]))
}

const totalPerfOutput = [
  '2000000000,,duration_time,1,100.00,,',
  '1000000000,,user_time,1,100.00,,',
  '500000000,,system_time,1,100.00,,',
  '1500,msec,task-clock,1,100.00,,',
  '300,,instructions:u,1,100.00,,',
  '100,,cycles:u,1,100.00,,',
  '4,,context-switches,1,100.00,,',
  '2,,cpu-migrations,1,100.00,,',
  '11,,page-faults,1,100.00,,',
  '10,,minor-faults,1,100.00,,',
  '1,,major-faults,1,100.00,,',
].join('\n')

test('parses total perf stat CSV and derives ratios', () => {
  expect(parsePerfStatOutput(totalPerfOutput)).toEqual({
    averageCpuCores: 0.75,
    contextSwitches: 4,
    cpuMigrations: 2,
    cycles: 100,
    durationSeconds: 2,
    instructions: 300,
    instructionsPerCycle: 3,
    majorPageFaults: 1,
    minorPageFaults: 10,
    pageFaults: 11,
    systemTimeSeconds: 0.5,
    taskClockSeconds: 1.5,
    userTimeSeconds: 1,
  })
})

test('sums perf stat interval CSV', () => {
  const intervalOutput = totalPerfOutput
    .split('\n')
    .flatMap((line, index) => [`0.100000000,${line}`, `0.200000000,${line}`])
    .join('\n')
  const result = parsePerfStatOutput(intervalOutput)
  expect(result.durationSeconds).toBe(4)
  expect(result.instructions).toBe(600)
  expect(result.taskClockSeconds).toBe(3)
  expect(result.averageCpuCores).toBe(0.75)
})

test('rejects unsupported perf counters instead of returning zero', () => {
  expect(() => parsePerfStatOutput(totalPerfOutput.replace('300,,instructions:u', '<not supported>,,instructions:u'))).toThrow(
    'Required perf counters are unsupported on this system: instructions',
  )
})

test('reports an actionable perf permission error', () => {
  expect(() => parsePerfStatOutput('Error:\nNo permission to enable task-clock event.')).toThrow(
    'check /proc/sys/kernel/perf_event_paranoid',
  )
})

test('parses process stat fields after a command name containing spaces', () => {
  const fields = ['S', '12', ...Array.from({ length: 17 }, () => '0'), '98765', '0']
  expect(parseProcessStat(`42 (Electron Helper) ${fields.join(' ')}`)).toEqual({
    parentPid: 12,
    pid: 42,
    startTimeTicks: '98765',
  })
})

test('tracks descendants after reparenting and ignores PID reuse', () => {
  const initial = updateTrackedProcesses(
    1,
    new Map(),
    processTable(processIdentity(1, 0, 'a'), processIdentity(2, 1, 'b'), processIdentity(3, 2, 'c')),
  )
  const updated = updateTrackedProcesses(
    1,
    initial,
    processTable(
      processIdentity(1, 0, 'a'),
      processIdentity(2, 0, 'b'),
      processIdentity(3, 0, 'replacement'),
      processIdentity(4, 2, 'd'),
      processIdentity(5, 0, 'unrelated'),
    ),
  )
  expect([...updated.keys()].sort()).toEqual([1, 2, 4])
})

test('parses PSS from smaps_rollup', () => {
  expect(parseSmapsRollupPssKiB('Rss: 200 kB\nPss:                123 kB\nPrivate_Clean: 1 kB\n')).toBe(123)
})

test('sampler retries when the process tree changes during a sample', async () => {
  const stable = processTable(processIdentity(1, 0), processIdentity(2, 1))
  const changed = processTable(processIdentity(1, 0))
  const tables = [stable, changed, stable, stable, stable, stable]
  let tableIndex = 0
  const sampler = createProcessTreeSampler(
    1,
    {
      getProcessTable: async () => tables[tableIndex++] || stable,
      now: () => 100,
      readPssKiB: async (pid) => pid * 10,
    },
    { intervalMs: 10_000 },
  )
  await sampler.start()
  const result = await sampler.stop()
  expect(result.droppedSampleCount).toBe(0)
  expect(result.samples).toHaveLength(2)
  expect(result.samples[0]).toMatchObject({ processCount: 2, pssKiB: 30 })
})

test('sampler fails instead of converting a smaps permission error to a dropped sample', async () => {
  const stable = processTable(processIdentity(1, 0))
  const sampler = createProcessTreeSampler(
    1,
    {
      getProcessTable: async () => stable,
      readPssKiB: async () => {
        throw Object.assign(new Error('permission denied'), { code: 'EACCES' })
      },
    },
    { intervalMs: 10_000 },
  )
  await expect(sampler.start()).rejects.toThrow('permission denied')
})

test('creates the normalized informational result', () => {
  const result = LinuxProcessTreeResourceResult.createResult({
    droppedSampleCount: 1,
    perfRawOutput: totalPerfOutput,
    samples: [
      { processCount: 2, pssKiB: 1024, timestamp: 1, type: 'sample' },
      { processCount: 3, pssKiB: 3072, timestamp: 2, type: 'sample' },
      { processCount: 2, pssKiB: 2048, timestamp: 3, type: 'sample' },
    ],
    window: 'scenario',
  })
  expect(result).toMatchObject({
    isLeak: false,
    memory: {
      deltaPssMiB: 1,
      endingPssMiB: 2,
      sampledPeakPssMiB: 3,
      startingPssMiB: 1,
    },
    processes: {
      endingProcessCount: 2,
      peakProcessCount: 3,
      startingProcessCount: 2,
    },
    sampling: {
      droppedSampleCount: 1,
      intervalMs: 250,
      validSampleCount: 3,
    },
    window: 'scenario',
  })
  expect(result.metrics).toEqual(
    expect.arrayContaining([
      { name: 'validSampleCount', unit: 'count', value: 3 },
      { name: 'droppedSampleCount', unit: 'count', value: 1 },
      { name: 'samplingIntervalMs', unit: 'milliseconds', value: 250 },
    ]),
  )
})
