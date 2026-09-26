import { expect, test } from '@jest/globals'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Measure from '../src/parts/MeasureLinuxCgroupMemory/MeasureLinuxCgroupMemory.ts'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'

test('public measure resolves', () => expect(GetMeasure.getMeasure({ Measures }, 'linux-cgroup-memory')).toBe(Measure))
test('preserves kernel counters without assuming all fields are bytes', () => {
  expect(Measure.parseStat('anon 1024\nfile 2048\npgfault 42\n')).toEqual({ anon: 1024, file: 2048, pgfault: 42 })
  expect(() => Measure.parseStat('anon invalid')).toThrow()
})
test('captures and compares counters, supports absent swap and rejects wrong membership', async () => {
  const path = await mkdtemp(join(tmpdir(), 'cgroup-measure-'))
  try {
    await Promise.all([
      writeFile(join(path, 'memory.current'), '100'),
      writeFile(join(path, 'memory.stat'), 'anon 100\nfile 0'),
      writeFile(join(path, 'cgroup.procs'), '123\n'),
    ])
    const before = await Measure.capture({ path, pid: 123 })
    expect(before.swapBytes).toBeNull()
    await writeFile(join(path, 'memory.current'), '100000')
    const after = await Measure.capture({ path, pid: 123 })
    expect(Measure.compare(before, after).deltaBytes).toBe(99900)
    expect(Measure.isLeak(Measure.compare(before, after))).toBe(true)
    expect(Measure.isLeak(Measure.compare(before, before))).toBe(false)
    expect(() => Measure.compare(before, { ...after, identity: 'different' })).toThrow('different cgroups')
    await expect(Measure.capture({ path, pid: 124 })).rejects.toThrow('not in')
    await writeFile(join(path, 'memory.current'), 'garbage')
    await expect(Measure.capture({ path, pid: 123 })).rejects.toThrow('byte counter')
  } finally {
    await rm(path, { recursive: true, force: true })
  }
})
