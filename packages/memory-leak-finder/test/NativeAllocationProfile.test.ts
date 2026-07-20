import { expect, test } from '@jest/globals'
import {
  formatNativeAllocationProfileSummary,
  getNativeAllocationProfileSummary,
  type NativeAllocationProfileStack,
} from '../src/parts/NativeAllocationProfile/NativeAllocationProfile.ts'

test('getNativeAllocationProfileSummary aggregates identical stacks and totals allocation bytes', () => {
  const profile = {
    modules: [
      {
        baseAddress: '0x1000',
        name: 'libchromium.so',
        size: 4096,
        uuid: 'chromium-uuid',
      },
    ],
    samples: [
      {
        size: 10,
        stack: ['malloc', 'renderWorkbench'],
        total: 100,
      },
      {
        size: 20,
        stack: ['malloc', 'renderWorkbench'],
        total: 200,
      },
      {
        size: 15,
        stack: ['SkCanvas::draw', 'paint'],
        total: 500,
      },
    ],
  }

  const result = getNativeAllocationProfileSummary(profile)

  expect(result.metrics).toEqual({
    attributedAllocationBytes: 800,
    moduleCount: 1,
    sampleCount: 3,
    sampledBytes: 45,
  })
  expect(result.topStacks).toEqual([
    {
      attributedAllocationBytes: 500,
      sampledBytes: 15,
      stack: ['SkCanvas::draw', 'paint'],
    },
    {
      attributedAllocationBytes: 300,
      sampledBytes: 30,
      stack: ['malloc', 'renderWorkbench'],
    },
  ])
  expect(result.modules).toEqual([
    {
      baseAddress: '0x1000',
      name: 'libchromium.so',
      size: 4096,
      uuid: 'chromium-uuid',
    },
  ])
  expect(result.rawProfile).toBe(profile)
})

test('getNativeAllocationProfileSummary handles malformed samples and normalizes modules', () => {
  const result = getNativeAllocationProfileSummary({
    modules: [
      null,
      'invalid',
      {
        baseAddress: 100,
        name: 'electron',
        size: -1,
        uuid: null,
      },
      {
        baseAddress: '0x2000',
        name: 'skia',
        size: 2048,
        uuid: 'skia-uuid',
      },
    ],
    samples: [
      null,
      'invalid',
      {
        size: Number.POSITIVE_INFINITY,
        stack: ['valid', 1, null],
        total: -5,
      },
      {
        size: 5,
        stack: 'invalid',
        total: 10,
      },
    ],
  })

  expect(result.metrics).toEqual({
    attributedAllocationBytes: 10,
    moduleCount: 2,
    sampleCount: 2,
    sampledBytes: 5,
  })
  expect(result.topStacks).toEqual([
    {
      attributedAllocationBytes: 10,
      sampledBytes: 5,
      stack: [],
    },
    {
      attributedAllocationBytes: 0,
      sampledBytes: 0,
      stack: ['valid'],
    },
  ])
  expect(result.modules).toEqual([
    {
      baseAddress: '',
      name: 'electron',
      size: 0,
      uuid: '',
    },
    {
      baseAddress: '0x2000',
      name: 'skia',
      size: 2048,
      uuid: 'skia-uuid',
    },
  ])
})

test('getNativeAllocationProfileSummary ranks by attributed bytes and limits stacks to 20 rows', () => {
  const samples = Array.from({ length: 25 }, (_, index) => ({
    size: index,
    stack: [`stack-${index}`],
    total: index,
  }))

  const result = getNativeAllocationProfileSummary({ samples })

  expect(result.topStacks).toHaveLength(20)
  expect(result.topStacks[0].stack).toEqual(['stack-24'])
  expect(result.topStacks[19].stack).toEqual(['stack-5'])
})

test('formatNativeAllocationProfileSummary formats metrics and only the top 10 stacks', () => {
  const topStacks: NativeAllocationProfileStack[] = Array.from({ length: 11 }, (_, index) => ({
    attributedAllocationBytes: 100 - index,
    sampledBytes: 10 - index,
    stack: [`stack-${index}`, 'root'],
  }))

  const result = formatNativeAllocationProfileSummary({
    metrics: {
      attributedAllocationBytes: 1045,
      moduleCount: 2,
      sampleCount: 11,
      sampledBytes: 55,
    },
    supported: true,
    topStacks,
    unsupportedReason: '',
  })

  expect(result).toContain('Native allocation profile:')
  expect(result).toContain('sampleCount | 11')
  expect(result).toContain('attributedAllocationBytes | sampledBytes | stack')
  expect(result).toContain('100 | 10 | stack-0 <- root')
  expect(result).toContain('91 | 1 | stack-9 <- root')
  expect(result).not.toContain('stack-10')
})

test('formatNativeAllocationProfileSummary explains unavailable profiles', () => {
  const result = formatNativeAllocationProfileSummary({
    metrics: {
      attributedAllocationBytes: 0,
      moduleCount: 0,
      sampleCount: 0,
      sampledBytes: 0,
    },
    supported: false,
    topStacks: [],
    unsupportedReason: 'CDP Memory sampling is unavailable',
  })

  expect(result).toContain('supported | false')
  expect(result).toContain('unsupportedReason | CDP Memory sampling is unavailable')
})
