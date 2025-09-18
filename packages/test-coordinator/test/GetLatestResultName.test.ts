import { test, expect } from '@jest/globals'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as GetLatestResultName from '../src/parts/GetLatestResultName/GetLatestResultName.ts'
import * as MemoryLeakResultsPath from '../src/parts/MemoryLeakResultsPath/MemoryLeakResultsPath.ts'

test('getLatestResultName - returns null when results directory does not exist', async () => {
  const measure = 'nonexistent-measure'
  
  const result = await GetLatestResultName.getLatestResultName(measure)
  
  expect(result).toBeNull()
})

test('getLatestResultName - returns null when results directory is empty', async () => {
  const measure = 'empty-measure'
  const resultsPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, measure)
  
  if (!existsSync(resultsPath)) {
    mkdirSync(resultsPath, { recursive: true })
  }
  
  const result = await GetLatestResultName.getLatestResultName(measure)
  
  expect(result).toBeNull()
})

test('getLatestResultName - returns the most recently modified file', async () => {
  const measure = 'test-measure'
  const resultsPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, measure)
  
  if (!existsSync(resultsPath)) {
    mkdirSync(resultsPath, { recursive: true })
  }
  
  // Create two test files with different modification times
  const file1 = join(resultsPath, 'test1.json')
  const file2 = join(resultsPath, 'test2.json')
  
  writeFileSync(file1, JSON.stringify({ test: 'data1' }))
  
  // Wait a bit to ensure different modification times
  await new Promise(resolve => setTimeout(resolve, 10))
  
  writeFileSync(file2, JSON.stringify({ test: 'data2' }))
  
  const result = await GetLatestResultName.getLatestResultName(measure)
  
  // Should return the most recently modified file
  expect(result).toBe('test2.json')
})
