import { expect, jest, test } from '@jest/globals'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

const prepare = jest.fn<(...args: unknown[]) => Promise<Snapshot>>()
const analyze = jest.fn<(...args: unknown[]) => unknown>()
jest.unstable_mockModule('../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.ts', () => ({ prepareHeapSnapshot: prepare }))
jest.unstable_mockModule('../src/parts/GetDuplicateObjectGraphs/GetDuplicateObjectGraphs.ts', () => ({ getDuplicateObjectGraphs: analyze }))
const { compareDuplicateObjectGraphs } = await import('../src/parts/CompareDuplicateObjectGraphs/CompareDuplicateObjectGraphs.ts')

test('analyzes sequentially with strings and compares duplicate byte totals', async () => {
  const before = {} as Snapshot
  const after = {} as Snapshot
  prepare.mockResolvedValueOnce(before).mockResolvedValueOnce(after)
  const group = {
    fingerprint: 'internal hash',
    representativeNodeId: 7,
    exampleNodeIds: [7, 9],
    count: 2,
    duplicateCount: 1,
    duplicateBytes: 32,
    preview: { x: 1 },
  }
  const publicGroup = { count: 2, duplicateCount: 1, duplicateBytes: 32, preview: { x: 1 } }
  const beforeReport = { complete: true, duplicateBytes: 32, groups: [group] }
  const afterReport = { complete: true, duplicateBytes: 96, groups: [group] }
  analyze.mockReturnValueOnce(beforeReport).mockReturnValueOnce(afterReport)
  expect(await compareDuplicateObjectGraphs('before', 'after')).toEqual({
    before: 32,
    after: 96,
    delta: 64,
    beforeDetails: { ...beforeReport, groups: [publicGroup] },
    afterDetails: { ...afterReport, groups: [publicGroup] },
  })
  expect(prepare).toHaveBeenCalledWith('before', { parseStrings: true })
  expect(prepare).toHaveBeenCalledWith('after', { parseStrings: true })
  expect(prepare.mock.invocationCallOrder[0]).toBeLessThan(analyze.mock.invocationCallOrder[0])
  expect(analyze.mock.invocationCallOrder[0]).toBeLessThan(prepare.mock.invocationCallOrder[1])
})

test('refuses to turn partial analysis into a leak verdict', async () => {
  prepare.mockResolvedValue({} as Snapshot)
  analyze
    .mockReturnValueOnce({ complete: false, duplicateBytes: 10, statistics: { unverifiedObjects: 3 } })
    .mockReturnValueOnce({ complete: true, duplicateBytes: 0, statistics: { unverifiedObjects: 0 } })
  await expect(compareDuplicateObjectGraphs('before', 'after')).rejects.toThrow('Partial totals cannot establish a leak')
})
