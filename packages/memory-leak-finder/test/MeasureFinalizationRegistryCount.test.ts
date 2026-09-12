import { beforeEach, expect, jest, test } from '@jest/globals'

const mockGetFinalizationRegistryCount = jest.fn<(...args: any[]) => Promise<number>>()

jest.unstable_mockModule('../src/parts/GetFinalizationRegistryCount/GetFinalizationRegistryCount.ts', () => ({
  getFinalizationRegistryCount: mockGetFinalizationRegistryCount,
}))

const GetMeasure = await import('../src/parts/GetMeasure/GetMeasure.ts')
const Measures = await import('../src/parts/Measures/Measures.ts')
const MeasureFinalizationRegistryCount = await import('../src/parts/MeasureFinalizationRegistryCount/MeasureFinalizationRegistryCount.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockGetFinalizationRegistryCount.mockResolvedValueOnce(2).mockResolvedValueOnce(5)
})

test('measures FinalizationRegistry growth in browser, Node, and worker targets', async () => {
  const session = {}
  const args = MeasureFinalizationRegistryCount.create(session as any) as [any]
  const before = await MeasureFinalizationRegistryCount.start(...args)
  const after = await MeasureFinalizationRegistryCount.stop(...args)
  const comparison = MeasureFinalizationRegistryCount.compare(before, after)

  expect(MeasureFinalizationRegistryCount.id).toBe('finalizationRegistryCount')
  expect(MeasureFinalizationRegistryCount.targets).toEqual([1, 2, 3])
  expect(comparison).toEqual({ after: 5, before: 2 })
  expect(MeasureFinalizationRegistryCount.isLeak(comparison)).toBe(true)
})

test('resolves the public kebab-case measure id', () => {
  expect(GetMeasure.getMeasure({ Measures }, 'finalization-registry-count')).toBe(Measures.MeasureFinalizationRegistryCount)
})
