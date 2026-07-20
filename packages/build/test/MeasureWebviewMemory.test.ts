import { expect, test } from '@jest/globals'
import { parseSmapsRollup, subtractMemorySamples } from '../src/measureWebviewMemory.ts'

test('parses proportional, resident, and private memory from smaps_rollup', () => {
  const contents = `00400000-00401000 r--p 00000000 00:00 0
Rss:                 12000 kB
Pss:                  9000 kB
Private_Clean:        2000 kB
Private_Dirty:        3500 kB
Private_Hugetlb:       250 kB
Shared_Clean:         6000 kB
Shared_Dirty:          500 kB
`
  expect(parseSmapsRollup(contents)).toEqual({
    privateKiB: 5750,
    pssKiB: 9000,
    rssKiB: 12000,
  })
})

test('computes the incremental memory used after opening a webview', () => {
  expect(
    subtractMemorySamples(
      { privateMiB: 500.125, processCount: 7, pssMiB: 600.5, rssMiB: 900.75 },
      { privateMiB: 518.5, processCount: 8, pssMiB: 621.25, rssMiB: 935.125 },
    ),
  ).toEqual({
    privateMiB: 18.375,
    processCount: 1,
    pssMiB: 20.75,
    rssMiB: 34.375,
  })
})
