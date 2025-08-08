import { test, expect } from '@jest/globals'
import { getTypeCount } from '../src/parts/GetTypeCount/GetTypeCount.js'
import { join } from 'path'

test.skip('should count regexp objects from heap snapshot', async () => {
  const path = join(process.cwd(), '.vscode-heapsnapshots', '0.json')
  const count = await getTypeCount(path, 'regexp')
  expect(count).toBe(435)
})

test.skip('should count array objects from heap snapshot', async () => {
  const path = join(process.cwd(), '.vscode-heapsnapshots', '0.json')
  const count = await getTypeCount(path, 'array')
  expect(count).toBeGreaterThan(0)
})

test.skip('should count string objects from heap snapshot', async () => {
  const path = join(process.cwd(), '.vscode-heapsnapshots', '0.json')
  const count = await getTypeCount(path, 'string')
  expect(count).toBeGreaterThan(0)
})
