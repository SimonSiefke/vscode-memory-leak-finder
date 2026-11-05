import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as Path from '../Path/Path.ts'

// npm exec makes the revision's pinned pnpm available to lifecycle scripts too,
// without requiring Corepack or changing the globally installed package manager.
export const getPnpmCommandArgs = async (cwd: string, args: readonly string[]): Promise<string[] | undefined> => {
  if (!(await FileSystemWorker.pathExists(Path.join(cwd, 'pnpm-lock.yaml')))) {
    return undefined
  }
  const { packageManager } = JSON.parse(await FileSystemWorker.readFileContent(Path.join(cwd, 'package.json')))
  if (typeof packageManager !== 'string' || !/^pnpm@\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+sha\d+\.[a-f\d]+)?$/.test(packageManager)) {
    throw new Error(`Expected a pinned pnpm version in '${cwd}/package.json'`)
  }
  const specifier = packageManager.split('+')[0]
  return ['exec', '--yes', `--package=${specifier}`, '--', 'pnpm', ...args]
}
