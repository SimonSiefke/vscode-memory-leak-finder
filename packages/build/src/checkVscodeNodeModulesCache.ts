import { access, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

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

export const getExpectedTopLevelPackages = (packageLockContent: string): readonly string[] => {
  const parsed = JSON.parse(packageLockContent) as PackageLock
  const rootPackage = parsed.packages?.['']
  if (!rootPackage) {
    return []
  }
  const dependencyNames = Object.keys(rootPackage.dependencies || {})
  const devDependencyNames = Object.keys(rootPackage.devDependencies || {})
  return [...new Set([...dependencyNames, ...devDependencyNames])].sort()
}

export const hasCompleteNodeModulesInDirectory = async (packageDirectory: string): Promise<boolean> => {
  const packageLockPath = join(packageDirectory, 'package-lock.json')
  const nodeModulesPackageLockPath = join(packageDirectory, 'node_modules', '.package-lock.json')

  if (!(await pathExists(packageLockPath)) || !(await pathExists(nodeModulesPackageLockPath))) {
    return false
  }

  const packageLockContent = await readFile(packageLockPath, 'utf8')
  const expectedTopLevelPackages = getExpectedTopLevelPackages(packageLockContent)

  if (expectedTopLevelPackages.length === 0) {
    return false
  }

  const packageExistence = await Promise.all(
    expectedTopLevelPackages.map((packageName) => pathExists(join(packageDirectory, 'node_modules', ...packageName.split('/')))),
  )

  return packageExistence.every(Boolean)
}

const findNestedPackageDirectories = async (repoPath: string): Promise<readonly string[]> => {
  const packageDirectories = new Set<string>()

  const visit = async (currentPath: string): Promise<void> => {
    const entries = (await readdir(currentPath, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue
      }
      const entryPath = join(currentPath, entry.name)
      if (entry.isDirectory()) {
        await visit(entryPath)
        continue
      }
      if (entry.isFile() && entry.name === 'package-lock.json' && currentPath !== repoPath) {
        packageDirectories.add(currentPath)
      }
    }
  }

  await visit(repoPath)
  return [...packageDirectories].sort()
}

const getPackageDirectoriesToValidate = async (repoPath: string): Promise<readonly string[]> => {
  const nestedPackageDirectories = await findNestedPackageDirectories(repoPath)
  const validNestedPackageDirectories = await Promise.all(
    nestedPackageDirectories.map(async (packageDirectory) => {
      const packageJsonPath = join(packageDirectory, 'package.json')
      return (await pathExists(packageJsonPath)) ? packageDirectory : ''
    }),
  )
  return [repoPath, ...validNestedPackageDirectories.filter(Boolean)]
}

export const hasCompleteNodeModulesCache = async (repoPath: string): Promise<boolean> => {
  const packageDirectories = await getPackageDirectoriesToValidate(repoPath)
  if (packageDirectories.length === 0) {
    return false
  }
  const results = await Promise.all(packageDirectories.map((packageDirectory) => hasCompleteNodeModulesInDirectory(packageDirectory)))
  return results.every(Boolean)
}

const main = async (): Promise<void> => {
  const repoPath = process.argv[2]

  if (!repoPath) {
    process.stderr.write('Missing VS Code repository path.\n')
    process.exitCode = 1
    return
  }

  if (await hasCompleteNodeModulesCache(repoPath)) {
    return
  }

  process.stderr.write(`VS Code node_modules cache is incomplete for '${repoPath}'.\n`)
  process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
