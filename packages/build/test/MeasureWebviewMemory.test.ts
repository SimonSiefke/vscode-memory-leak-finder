import { expect, test } from '@jest/globals'
import { parseSmapsRollup } from '../src/measureWebviewMemory.ts'

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
