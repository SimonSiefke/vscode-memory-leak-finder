import { existsSync } from 'node:fs'
import * as Assert from '../Assert/Assert.ts'
import * as FileSystem from '../FileSystem/FileSystem.ts'
import * as FormatPaths from '../FormatPaths/FormatPaths.ts'
import * as GetMatchingFiles from '../GetMatchingFiles/GetMatchingFiles.ts'
import * as Path from '../Path/Path.ts'
import { VError } from '../VError/VError.ts'

export const getTestsToRun = async (root, cwd, filterValue) => {
  try {
    Assert.string(root)
    Assert.string(cwd)
    Assert.string(filterValue)
    const testsPath = Path.join(root, 'src')
    if (!existsSync(testsPath)) {
      throw new Error(`test folder not found: ${testsPath}`)
    }
    const testDirents = await FileSystem.readDir(testsPath)
    const matchingDirents = GetMatchingFiles.getMatchingFiles(testDirents, filterValue)
    const formattedPaths = FormatPaths.formatPaths(cwd, testsPath, matchingDirents)
    return formattedPaths
  } catch (error) {
    throw new VError(error, `Failed to determine which tests to run`)
  }
}
