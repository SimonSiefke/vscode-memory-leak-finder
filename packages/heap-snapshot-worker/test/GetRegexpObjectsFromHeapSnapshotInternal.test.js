import { expect, test } from '@jest/globals'
import { getRegexpObjectsFromHeapSnapshot } from '../src/parts/GetRegexpObjectsFromHeapSnapshot/GetRegexpObjectsFromHeapSnapshot.js'
import { join } from 'path'

test.skip('should return array of regex objects from heap snapshot', async () => {
  const path = join(process.cwd(), '..', '..', '.vscode-heapsnapshots', '0.json')
  const regexObjects = await getRegexpObjectsFromHeapSnapshot(path)

  expect(Array.isArray(regexObjects)).toBe(true)
  expect(regexObjects.length).toBe(435)

  // Check that objects have the expected structure
  regexObjects.forEach(obj => {
    expect(obj).toHaveProperty('id')
    expect(obj).toHaveProperty('pattern')
    expect(typeof obj.id).toBe('number')
    expect(typeof obj.pattern).toBe('string')
  })

  // Check that we have some expected regex patterns
  const hasExpectedPatterns = regexObjects.some(obj =>
    obj.pattern.includes('\\d+') ||
    obj.pattern.includes('\\s') ||
    obj.pattern.includes('.*')
  )
  expect(hasExpectedPatterns).toBe(true)

  // Check that objects are sorted by pattern length
  for (let i = 1; i < regexObjects.length; i++) {
    expect(regexObjects[i].pattern.length).toBeGreaterThanOrEqual(regexObjects[i-1].pattern.length)
  }
})
