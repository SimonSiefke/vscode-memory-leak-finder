import * as Assert from '../Assert/Assert.js'
import * as FileSystem from '../FileSystem/FileSystem.js'
import * as FormatPaths from '../FormatPaths/FormatPaths.js'
import * as GetMatchingFiles from '../GetMatchingFiles/GetMatchingFiles.js'
import * as Path from '../Path/Path.js'
import { VError } from '../VError/VError.js'

export const getTestsToRun = async (root, cwd, filterValue) => {
  try {
    Assert.string(root)
    Assert.string(cwd)
    Assert.string(filterValue)
    const testsPath = Path.join(root, 'src')
    const testDirents = await FileSystem.readDir(testsPath)
    const matchingDirents = GetMatchingFiles.getMatchingFiles(testDirents, filterValue)
    const formattedPaths = FormatPaths.formatPaths(cwd, testsPath, matchingDirents)
    return formattedPaths
  } catch (error) {
    throw new VError(error, `Failed to determine which tests to run`)
  }
}
