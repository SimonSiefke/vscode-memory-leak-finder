import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('../src/parts/ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts', () => ({
  resolveTrackedLocationSourceMaps: jest.fn(async () => ({
    '1:2:3': {
      originalColumn: 8,
      originalLine: 257,
      originalLocation: 'src/vs/base/browser/dom.ts:257:8',
      originalName: 'DomListener',
      originalSource: 'src/vs/base/browser/dom.ts',
    },
  })),
}))

test('compareTrackedAllocations includes the original constructor type', async () => {
  const CompareTrackedAllocations = await import('../src/parts/CompareTrackedAllocations/CompareTrackedAllocations.ts')
  const result = await CompareTrackedAllocations.compareTrackedAllocations(
    {},
    {
      trackedAllocations: {
        '1:2:3:Eui': {
          aliveCount: 1,
          collectedCount: 2,
          createdCount: 3,
          location: '1:2:3',
          type: 'Eui',
        },
      },
    },
    {} as any,
  )

  expect(result).toEqual([
    expect.objectContaining({
      originalType: 'DomListener',
      type: 'Eui',
    }),
  ])
})
