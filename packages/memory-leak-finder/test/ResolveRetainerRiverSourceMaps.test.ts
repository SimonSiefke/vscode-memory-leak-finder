import { beforeEach, expect, jest, test } from '@jest/globals'

const resolveTrackedLocationSourceMaps = jest.fn()

jest.unstable_mockModule('../src/parts/ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts', () => ({
  resolveTrackedLocationSourceMaps,
}))

const { resolveRetainerRiverSourceMaps } = await import('../src/parts/ResolveRetainerRiverSourceMaps/ResolveRetainerRiverSourceMaps.ts')

const createReport = () => ({
  links: [
    {
      evidence: [
        {
          allocationStack: [
            {
              functionName: 'createOwner',
              generated: {
                column: 8,
                line: 20,
                scriptId: 17,
                source: 'bundle.js',
              },
            },
          ],
          leakedObject: 'Widget',
          leakedObjectStack: [],
          path: [],
          retainingProperty: '_widgets',
        },
      ],
    },
  ],
})

beforeEach(() => {
  resolveTrackedLocationSourceMaps.mockReset()
})

test('resolveRetainerRiverSourceMaps batches locations and preserves generated fallbacks', async () => {
  resolveTrackedLocationSourceMaps.mockResolvedValue({
    '17:21:9': {
      originalColumn: 3,
      originalLine: 42,
      originalLocation: 'src/owner.ts:42:3',
      originalName: 'createOwner',
      originalSource: 'src/owner.ts',
    },
  } as never)

  const result: any = await resolveRetainerRiverSourceMaps(createReport(), {
    17: { sourceMapUrl: 'bundle.js.map', url: 'bundle.js' },
  })
  const frame = result.links[0].evidence[0].allocationStack[0]

  expect(resolveTrackedLocationSourceMaps).toHaveBeenCalledWith(['17:21:9'], { 17: { sourceMapUrl: 'bundle.js.map', url: 'bundle.js' } })
  expect(frame.generated).toEqual({
    column: 8,
    line: 20,
    scriptId: 17,
    source: 'bundle.js',
  })
  expect(frame.original).toEqual({
    column: 3,
    line: 41,
    name: 'createOwner',
    source: 'src/owner.ts',
  })
  expect(result.links[0].evidence[0].retainingLocation).toEqual(frame.original)
})

test('resolveRetainerRiverSourceMaps uses the generated location when a source map cannot be resolved', async () => {
  resolveTrackedLocationSourceMaps.mockResolvedValue({
    '17:21:9': {
      originalColumn: null,
      originalLine: null,
      originalLocation: null,
      originalName: null,
      originalSource: null,
    },
  } as never)

  const result: any = await resolveRetainerRiverSourceMaps(createReport(), {})
  const evidence = result.links[0].evidence[0]

  expect(evidence.allocationStack[0].original).toBeUndefined()
  expect(evidence.retainingLocation).toEqual(evidence.allocationStack[0].generated)
})

test('resolveRetainerRiverSourceMaps avoids launching source-map work for reports without locations', async () => {
  const report = {
    links: [
      {
        evidence: [
          {
            allocationStack: [],
            leakedObject: 'Widget',
            leakedObjectStack: [],
            path: [],
            retainingProperty: '_widgets',
          },
        ],
      },
    ],
  }

  await expect(resolveRetainerRiverSourceMaps(report, {})).resolves.toBe(report)
  expect(resolveTrackedLocationSourceMaps).not.toHaveBeenCalled()
})
