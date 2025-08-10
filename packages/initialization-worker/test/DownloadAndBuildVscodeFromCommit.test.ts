import { expect, test } from '@jest/globals'
import * as DownloadAndBuildVscodeFromCommit from '../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts'

test('downloadAndBuildVscodeFromCommit - function exists and is callable', () => {
  expect(typeof DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit).toBe('function')
})

test('downloadAndBuildVscodeFromCommit - function signature is correct', () => {
  const fn = DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit
  expect(fn.length).toBe(1) // Should accept one parameter (commitHash)
})
