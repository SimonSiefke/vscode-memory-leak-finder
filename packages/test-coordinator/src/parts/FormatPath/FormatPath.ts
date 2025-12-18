import * as Path from '../Path/Path.ts'

export const formatPath = (cwd, testsPath, dirent) => {
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
