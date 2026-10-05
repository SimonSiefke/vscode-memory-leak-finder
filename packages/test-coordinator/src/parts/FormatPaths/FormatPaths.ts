import * as FormatPath from '../FormatPath/FormatPath.ts'

export const formatPaths = (cwd: string, testsPath: string, dirents: readonly string[]) => {
  const formattedPaths: any[] = Array.from(dirents, (dirent) => FormatPath.formatPath(cwd, testsPath, dirent))
  return formattedPaths
}
