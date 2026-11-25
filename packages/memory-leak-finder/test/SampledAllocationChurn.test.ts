import { expect, test } from '@jest/globals'
import * as SampledAllocationChurn from '../src/parts/SampledAllocationChurn/SampledAllocationChurn.ts'

const frame = (functionName: string, lineNumber = 0, url = 'file:///app.js') => ({
  columnNumber: 4,
  functionName,
  lineNumber,
  scriptId: '7',
  url,
})

const node = (callFrame: unknown, selfSize: number, children: unknown[] = []) => ({ callFrame, children, id: 0, selfSize })

test('merges the same call frame reached through different callers and keeps stacks apart', () => {
  const profile = {
    head: node({ functionName: '(root)', url: '' }, 0, [
      node(frame('first', 1), 0, [node(frame('allocate', 10), 100)]),
      node(frame('second', 2), 50, [node(frame('allocate', 10), 300)]),
    ]),
    samples: [{}, {}, {}],
  }

  const result = SampledAllocationChurn.getSampledAllocationChurnSummary(profile, 32768)

  expect(result.metrics).toEqual({ callFrameCount: 2, sampleCount: 3, sampledAllocatedBytes: 450 })
  expect(result.samplingIntervalBytes).toBe(32768)
  expect(result.topSelfBytes).toEqual([
    { ...frame('allocate', 10), selfBytes: 400 },
    { ...frame('second', 2), selfBytes: 50 },
  ])
  expect(result.topStacks).toEqual([
    { selfBytes: 300, stack: ['allocate (file:///app.js:11:5)', 'second (file:///app.js:3:5)'] },
    { selfBytes: 100, stack: ['allocate (file:///app.js:11:5)', 'first (file:///app.js:2:5)'] },
    { selfBytes: 50, stack: ['second (file:///app.js:3:5)'] },
  ])
})

test('keeps frames with the same name in different scripts apart and limits stack depth', () => {
  let deepest: any = node(frame('leaf', 0, 'file:///b.js'), 10)
  for (let index = 0; index < SampledAllocationChurn.MaxStackDepth + 4; index++) {
    deepest = node(frame(`caller${index}`, index), 0, [deepest])
  }
  const profile = { head: node({}, 0, [deepest, node(frame('leaf', 0, 'file:///a.js'), 20)]), samples: [] }

  const result = SampledAllocationChurn.getSampledAllocationChurnSummary(profile, 1)

  expect(result.topSelfBytes.map((row) => [row.url, row.selfBytes])).toEqual([
    ['file:///a.js', 20],
    ['file:///b.js', 10],
  ])
  expect(result.topStacks[1].stack).toHaveLength(SampledAllocationChurn.MaxStackDepth)
  expect(result.topStacks[1].stack[0]).toBe('leaf (file:///b.js:1:5)')
})

test('caps the number of reported frames and stacks', () => {
  const children = Array.from({ length: 80 }, (_, index) => node(frame(`f${index}`, index), index + 1))
  const result = SampledAllocationChurn.getSampledAllocationChurnSummary({ head: node({}, 0, children) }, 1)

  expect(result.metrics.callFrameCount).toBe(80)
  expect(result.topSelfBytes).toHaveLength(SampledAllocationChurn.MaxTopSelfBytes)
  expect(result.topSelfBytes[0].functionName).toBe('f79')
  expect(result.topStacks).toHaveLength(SampledAllocationChurn.MaxTopStacks)
})

test('returns zero metrics for missing or malformed profiles', () => {
  for (const profile of [undefined, null, {}, { head: 1 }, { head: node({}, 0, [null, 1]) }]) {
    expect(SampledAllocationChurn.getSampledAllocationChurnSummary(profile, 32768, false, 'reason')).toEqual({
      metrics: { callFrameCount: 0, sampleCount: 0, sampledAllocatedBytes: 0 },
      samplingIntervalBytes: 32768,
      supported: false,
      topSelfBytes: [],
      topStacks: [],
      unsupportedReason: 'reason',
    })
  }
})

test('formats a readable summary with an anonymous function and unavailable reason', () => {
  const supported = SampledAllocationChurn.getSampledAllocationChurnSummary({ head: node({}, 0, [node(frame('', 0), 1234.6)]) }, 32768)
  expect(SampledAllocationChurn.formatSampledAllocationChurnSummary(supported)).toBe(
    [
      'Sampled allocation churn (statistical estimate, includes collected objects):',
      'supported | true',
      'samplingIntervalBytes | 32768',
      'sampledAllocatedBytes | 1234.6',
      'sampleCount | 0',
      'callFrameCount | 1',
      'top allocating functions:',
      'selfBytes | function | location',
      '1235 | (anonymous) | file:///app.js:1:5',
    ].join('\n'),
  )
  const unsupported = SampledAllocationChurn.getSampledAllocationChurnSummary(undefined, 32768, false, 'not available')
  expect(SampledAllocationChurn.formatSampledAllocationChurnSummary(unsupported)).toContain('unsupportedReason | not available')
})
