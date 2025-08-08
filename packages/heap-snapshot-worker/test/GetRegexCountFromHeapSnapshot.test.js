import { expect, test } from '@jest/globals'
import { getRegexCountFromHeapSnapshot } from '../src/parts/GetRegexCountFromHeapSnapshot/GetRegexCountFromHeapSnapshot.js'
import { join } from 'path'

test.skip('should count regexp objects from heap snapshot', async () => {
  const path = join(process.cwd(), '.vscode-heapsnapshots', '0.json')
  const count = await getRegexCountFromHeapSnapshot(path)
  expect(count).toBe(435)
})
