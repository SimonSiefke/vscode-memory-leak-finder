import * as Path from '../Path/Path.js'
import * as Filesystem from '../Filesystem/Filesystem.js'
// import { pathExists } from 'path-exists' (removed)
import * as CacheNodeModules from '../CacheNodeModules/CacheNodeModules.js'
import * as CheckCacheExists from '../CheckCacheExists/CheckCacheExists.js'
import * as CheckoutCommit from '../CheckoutCommit/CheckoutCommit.js'
import * as CloneRepository from '../CloneRepository/CloneRepository.js'
import * as InstallDependencies from '../InstallDependencies/InstallDependencies.js'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.js'
import * as RunCompile from '../RunCompile/RunCompile.js'
import * as SetupNodeModulesFromCache from '../SetupNodeModulesFromCache/SetupNodeModulesFromCache.js'
import * as Logger from '../Logger/Logger.js'

/**
 * @param {string} commitRef - The commit reference (branch name, tag, or commit hash)
 * @param {string} repoUrl - The repository URL to clone
 * @param {string} reposDir - The directory name for storing repositories
 * @param {string} cacheDir - The cache directory path
 */
export const downloadAndBuildVscodeFromCommit = async (commitRef, repoUrl, reposDir, cacheDir, useNice) => {
  // Resolve the commit reference to an actual commit hash
  const commitHash = await ResolveCommitHash.resolveCommitHash(repoUrl, commitRef)
  const repoPath = Path.join(reposDir, commitHash)

  // Create parent directory if it doesn't exist
  const existsReposDir = await Filesystem.pathExists(reposDir)

  // Check what's needed at the start
  const mainJsPath = Path.join(repoPath, 'out', 'main.js')
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
}
