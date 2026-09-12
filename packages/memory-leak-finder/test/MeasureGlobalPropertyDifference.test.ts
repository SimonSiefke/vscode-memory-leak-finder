import { beforeEach, expect, jest, test } from '@jest/globals'

const mockGetGlobalPropertyNames = jest.fn<(...args: any[]) => Promise<readonly string[]>>()

jest.unstable_mockModule('../src/parts/GetGlobalPropertyNames/GetGlobalPropertyNames.ts', () => ({
  getGlobalPropertyNames: mockGetGlobalPropertyNames,
}))

const GetMeasure = await import('../src/parts/GetMeasure/GetMeasure.ts')
const Measures = await import('../src/parts/Measures/Measures.ts')
const MeasureGlobalPropertyDifference = await import('../src/parts/MeasureGlobalPropertyDifference/MeasureGlobalPropertyDifference.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockGetGlobalPropertyNames.mockResolvedValueOnce(['document', 'window']).mockResolvedValueOnce(['document', 'leakedState', 'window'])
})

test('measures added global properties in browser, Node, and worker targets', async () => {
  const session = {}
  const args = MeasureGlobalPropertyDifference.create(session as any) as [any]
  const before = await MeasureGlobalPropertyDifference.start(...args)
  const after = await MeasureGlobalPropertyDifference.stop(...args)
  const comparison = MeasureGlobalPropertyDifference.compare(before, after)

  expect(MeasureGlobalPropertyDifference.id).toBe('globalPropertyDifference')
  expect(MeasureGlobalPropertyDifference.targets).toEqual([1, 2, 3])
  expect(comparison).toEqual(['leakedState'])
  expect(MeasureGlobalPropertyDifference.isLeak(comparison)).toBe(true)
  expect(MeasureGlobalPropertyDifference.isLeak([])).toBe(false)
})

test('resolves the public kebab-case measure id', () => {
  expect(GetMeasure.getMeasure({ Measures }, 'global-property-difference')).toBe(Measures.MeasureGlobalPropertyDifference)
})
