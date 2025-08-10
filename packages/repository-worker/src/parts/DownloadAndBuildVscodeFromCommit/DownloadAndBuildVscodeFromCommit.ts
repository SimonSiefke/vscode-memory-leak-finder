import * as CacheNodeModules from '../CacheNodeModules/CacheNodeModules.ts'
import * as CheckCacheExists from '../CheckCacheExists/CheckCacheExists.ts'
import * as CheckoutCommit from '../CheckoutCommit/CheckoutCommit.ts'
import * as CloneRepository from '../CloneRepository/CloneRepository.ts'
import * as Filesystem from '../Filesystem/Filesystem.ts'
import * as InstallDependencies from '../InstallDependencies/InstallDependencies.ts'
import * as Logger from '../Logger/Logger.ts'
import * as Path from '../Path/Path.ts'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.ts'
import * as RunCompile from '../RunCompile/RunCompile.ts'
import * as SetupNodeModulesFromCache from '../SetupNodeModulesFromCache/SetupNodeModulesFromCache.ts'
// import { pathExists } from 'path-exists' (removed)

/**
 * @param {string} commitRef - The commit reference (branch name, tag, or commit hash)
 * @param {string} repoUrl - The repository URL to clone
 * @param {string} reposDir - The directory name for storing repositories
 * @param {string} cacheDir - The cache directory path
 * @param {boolean} useNice - Whether to use nice command for resource management
 * @returns {Promise<string>} The path to the built VS Code binary
 */
export const downloadAndBuildVscodeFromCommit = async (commitRef, repoUrl, reposDir, cacheDir, useNice) => {
  // Resolve the commit reference to an actual commit hash
  const commitHash = await ResolveCommitHash.resolveCommitHash(repoUrl, commitRef)
  const repoPath = Path.join(reposDir, commitHash)

  // Create parent directory if it doesn't exist
  const existsReposDir = await Filesystem.pathExists(reposDir)

  // Check what's needed at the start
  const mainJsPath = Path.join(repoPath, 'out', 'main.ts')
  const nodeModulesPath = Path.join(repoPath, 'node_modules')
  const outPath = Path.join(repoPath, 'out')

  const existsRepoPath = await Filesystem.pathExists(repoPath)
  const existsMainJsPath = await Filesystem.pathExists(mainJsPath)
  const existsNodeModulesPath = await Filesystem.pathExists(nodeModulesPath)
  const existsOutPath = await Filesystem.pathExists(outPath)

  const needsClone = !existsRepoPath
  const needsInstall = !existsMainJsPath && !existsNodeModulesPath
  const needsCompile = !existsMainJsPath && !existsOutPath

  if (!existsReposDir) {
    await Filesystem.makeDirectory(reposDir)
  }

  // Clone the repository if needed
  if (needsClone) {
    await CloneRepository.cloneRepository(repoUrl, repoPath)
    await CheckoutCommit.checkoutCommit(repoPath, commitHash)
  }

  if (needsInstall) {
    Logger.log(`Installing dependencies for commit ${commitHash}...`)
    const cacheExists = await CheckCacheExists.checkCacheExists(commitHash, cacheDir)
    if (cacheExists) {
      await SetupNodeModulesFromCache.setupNodeModulesFromCache(repoPath, commitHash, cacheDir)
    } else {
      await InstallDependencies.installDependencies(repoPath, useNice)
      await CacheNodeModules.addNodeModulesToCache(repoPath, commitHash, cacheDir)
    }
  } else if (!existsMainJsPath) {
    Logger.log(`node_modules already exists in repo for commit ${commitHash}, skipping npm ci...`)
  }

  // Compile if needed
  if (needsCompile) {
    Logger.log(`Compiling VS Code for commit ${commitHash}...`)
    await RunCompile.runCompile(repoPath, useNice, mainJsPath)
  }

  // Return the path to the built VS Code binary
  const codeScriptPath = Path.join(repoPath, 'scripts', 'code.sh')
  return codeScriptPath
}
