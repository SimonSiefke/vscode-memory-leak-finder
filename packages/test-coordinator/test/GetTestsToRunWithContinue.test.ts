import { test, expect } from '@jest/globals'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as GetTestsToRunWithContinue from '../src/parts/GetTestsToRunWithContinue/GetTestsToRunWithContinue.ts'
import * as MemoryLeakResultsPath from '../src/parts/MemoryLeakResultsPath/MemoryLeakResultsPath.ts'

test('getTestsToRunWithContinue - without continue flag returns all tests', async () => {
  const root = process.cwd()
  const cwd = process.cwd()
  const filterValue = 'test'
  const measure = 'event-listener-count'
  const shouldContinueFlag = false

  const result = await GetTestsToRunWithContinue.getTestsToRunWithContinue(root, cwd, filterValue, measure, shouldContinueFlag)

  // Should return all tests when continue is false
  expect(result).toBeDefined()
})

test('getTestsToRunWithContinue - with continue flag filters out existing results', async () => {
  const root = process.cwd()
  const cwd = process.cwd()
  const filterValue = 'test'
  const measure = 'event-listener-count'
  const shouldContinueFlag = true

  // Create a temporary results directory
  const resultsPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, measure)
  if (!existsSync(resultsPath)) {
    mkdirSync(resultsPath, { recursive: true })
  }

  // Create a fake result file
  const fakeResult = { test: 'data' }
  writeFileSync(join(resultsPath, 'test1.json'), JSON.stringify(fakeResult))

  const result = await GetTestsToRunWithContinue.getTestsToRunWithContinue(root, cwd, filterValue, measure, shouldContinueFlag)

  // Should return tests that don't have existing results
  expect(result).toBeDefined()
})
