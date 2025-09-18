import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import * as MemoryLeakResultsPath from '../MemoryLeakResultsPath/MemoryLeakResultsPath.ts'
import * as GetTestsToRun from '../GetTestToRun/GetTestsToRun.ts'

export const getTestsToRunWithContinue = async (
  root: string,
  cwd: string,
  filterValue: string,
  measure: string,
  shouldContinueFlag: boolean
): Promise<readonly any[]> => {
  // Get all tests that would normally run
  const allTests = await GetTestsToRun.getTestsToRun(root, cwd, filterValue)

  if (!shouldContinueFlag) {
    return allTests
  }

  const resultsPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, measure)

  if (!existsSync(resultsPath)) {
    return allTests
  }

  const existingResults = await readdir(resultsPath)

  // Filter out tests that already have results
  const testsToRun = allTests.filter((testObj) => {
    // Convert test dirent to expected result filename
    // e.g., test.js -> test.json
    const resultFileName = testObj.dirent.replace(/\.(js|ts)$/, '.json')
    return !existingResults.includes(resultFileName)
  })

  return testsToRun
}
