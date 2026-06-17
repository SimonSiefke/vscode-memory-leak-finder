import * as Path from '../Path/Path.ts'

export const formatPath = (cwd: string, testsPath: string, dirent: string) => {
  const absolutePath = Path.join(testsPath, dirent)
  const relativePath = Path.relative(cwd, absolutePath)
  const relativeDirname = Path.dirname(relativePath)
  return {
    absolutePath,
    dirent,
    relativeDirname,
    relativePath,
  }
}
