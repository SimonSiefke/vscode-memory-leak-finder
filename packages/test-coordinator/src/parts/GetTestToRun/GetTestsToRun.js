import * as Assert from '../Assert/Assert.js'
import * as FileSystem from '../FileSystem/FileSystem.js'
import * as Path from '../Path/Path.js'

const getMatchingFiles = (dirents, filterValue) => {
  const matchingFiles = []
  for (const dirent of dirents) {
    if (dirent.includes(filterValue)) {
      matchingFiles.push(dirent)
    }
  }
  return matchingFiles
}

const formatPath = (cwd, testsPath, dirent) => {
  const absolutePath = Path.join(testsPath, dirent)
  const relativePath = Path.relative(cwd, absolutePath)
  const relativeDirname = Path.dirname(relativePath)
  return {
    absolutePath,
    relativePath,
    relativeDirname,
    dirent,
  }
}

const formatPaths = (cwd, testsPath, dirents) => {
  const formattedPaths = []
  for (const dirent of dirents) {
    formattedPaths.push(formatPath(cwd, testsPath, dirent))
  }
  return formattedPaths
}

export const getTestsToRun = async (root, cwd, filterValue) => {
  Assert.string(root)
  Assert.string(cwd)
  Assert.string(filterValue)
  const testsPath = Path.join(root, 'src')
  const testDirents = await FileSystem.readDir(testsPath)
  const matchingDirents = getMatchingFiles(testDirents, filterValue)
  const formattedPaths = formatPaths(cwd, testsPath, matchingDirents)
  return formattedPaths
}
