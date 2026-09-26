import { expect, test } from '@jest/globals'
import * as Measure from '../src/parts/MeasureLinuxAllocationStacks/MeasureLinuxAllocationStacks.ts'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'
const header = '[12:00:00] Top 100 stacks with outstanding allocations:\n'
const report = `${header}\t65536 bytes in 2 allocations from stack\n\t\t0x123 malloc+0x1 [libc.so]\n\t\t0x456 caller\n`
test('public measure resolves', () => expect(GetMeasure.getMeasure({ Measures }, 'linux-allocation-stacks')).toBe(Measure))
test('parses stacks and valid empty reports, rejects incomplete data', () => {
  expect(Measure.parseReport(report).rows[0]).toEqual({
    bytes: 65536,
    allocations: 2,
    stack: ['0x123 malloc+0x1 [libc.so]', '0x456 caller'],
  })
  expect(Measure.parseReport(header).rows).toEqual([])
  expect(() => Measure.parseReport('')).toThrow()
  expect(() => Measure.parseReport(`${header}\t1 bytes in 1 allocations from stack\n`)).toThrow('Incomplete')
})
test('missing baseline stack is unknown rather than zero, and profiles do not declare leaks', () => {
  const result = Measure.compare(Measure.parseReport(header), Measure.parseReport(report))
  expect(result.rows[0].deltaBytes).toBeNull()
  expect(Measure.isLeak()).toBe(false)
})
test('waits for complete reports and cleans up a running collector', async () => {
  const script = `setInterval(() => process.stdout.write(${JSON.stringify(report)}), 40)`
  const state = Measure.newState(process.execPath, ['-e', script], 'test')
  try {
    const before = await Measure.start(state)
    expect(before.rows).toHaveLength(1)
    const count = state.reportCount
    const after = await Measure.stop(state)
    expect(state.reportCount).toBeGreaterThanOrEqual(count + 2)
    expect(after.rows[0].bytes).toBe(65536)
    expect(state.exited).toBe(true)
    await Measure.releaseResources(state)
  } finally {
    await Measure.releaseResources(state)
  }
})
test('missing executable and collector failures reject instead of yielding empty results', async () => {
  await expect(Measure.start(Measure.newState('/nonexistent/bcc-memleak', [], 'test'))).rejects.toThrow('BCC memleak failed')
  const state = Measure.newState(process.execPath, ['-e', 'console.error("BPF permission denied"); process.exit(1)'], 'test')
  await expect(Measure.start(state)).rejects.toThrow('BPF permission denied')
  expect(state.exited).toBe(true)
})
test('releaseResources stops collection when the scenario fails before stop', async () => {
  const state = Measure.newState(process.execPath, ['-e', `setInterval(() => process.stdout.write(${JSON.stringify(report)}), 40)`], 'test')
  await Measure.start(state)
  await Measure.releaseResources(state)
  expect(state.exited).toBe(true)
})
