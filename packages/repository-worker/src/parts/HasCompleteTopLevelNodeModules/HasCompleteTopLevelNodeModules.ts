import { access, readFile } from 'node:fs/promises'
import * as Path from '../Path/Path.ts'

interface PackageLock {
  readonly packages?: Record<
    string,
    {
      readonly dependencies?: Record<string, string>
      readonly devDependencies?: Record<string, string>
    }
  >
}

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

const getExpectedTopLevelPackages = (packageLockContent: string): readonly string[] => {
  const parsed = JSON.parse(packageLockContent) as PackageLock
  const rootPackage = parsed.packages?.['']
  if (!rootPackage) {
    return []
  }
  const dependencyNames = Object.keys(rootPackage.dependencies || {})
  const devDependencyNames = Object.keys(rootPackage.devDependencies || {})
  return [...new Set([...dependencyNames, ...devDependencyNames])].sort()
}

const getNodeModulesPackagePath = (repoPath: string, packageName: string): string => {
  return Path.join(repoPath, 'node_modules', ...packageName.split('/'))
}

export const hasCompleteTopLevelNodeModules = async (repoPath: string): Promise<boolean> => {
  const packageLockPath = Path.join(repoPath, 'package-lock.json')
  const nodeModulesPackageLockPath = Path.join(repoPath, 'node_modules', '.package-lock.json')

  if (!(await pathExists(packageLockPath)) || !(await pathExists(nodeModulesPackageLockPath))) {
    return false
  }

  const packageLockContent = await readFile(packageLockPath, 'utf8')
  const expectedTopLevelPackages = getExpectedTopLevelPackages(packageLockContent)

  if (expectedTopLevelPackages.length === 0) {
    return false
  }

  const packageExistence = await Promise.all(
    expectedTopLevelPackages.map((packageName) => pathExists(getNodeModulesPackagePath(repoPath, packageName))),
  )

  return packageExistence.every(Boolean)
}
