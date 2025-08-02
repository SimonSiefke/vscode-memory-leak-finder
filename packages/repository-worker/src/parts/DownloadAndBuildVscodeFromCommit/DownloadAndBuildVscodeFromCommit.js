import { mkdir } from 'node:fs/promises'
import { platform } from 'node:os'
import { join } from 'node:path'
import { pathExists } from 'path-exists'
import { addNodeModulesToCache } from '../CacheNodeModules/CacheNodeModules.js'
import { checkCacheExists } from '../CheckCacheExists/CheckCacheExists.js'
import { checkoutCommit } from '../CheckoutCommit/CheckoutCommit.js'
import { cloneRepository } from '../CloneRepository/CloneRepository.js'
import * as InstallDependencies from '../InstallDependencies/InstallDependencies.js'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.js'
import * as RunCompile from '../RunCompile/RunCompile.js'
import { setupNodeModulesFromCache } from '../SetupNodeModulesFromCache/SetupNodeModulesFromCache.js'

/**
 * @param {string} commitRef - The commit reference (branch name, tag, or commit hash)
 * @param {string} repoUrl - The repository URL to clone
 * @param {string} reposDir - The directory name for storing repositories
 * @param {string} cacheDir - The cache directory path
 */
export const downloadAndBuildVscodeFromCommit = async (commitRef, repoUrl, reposDir, cacheDir) => {
  // Resolve the commit reference to an actual commit hash
  const commitHash = await ResolveCommitHash.resolveCommitHash(repoUrl, commitRef)
  const repoPath = join(reposDir, commitHash)

  // Create parent directory if it doesn't exist
  const existsReposDir = await pathExists(reposDir)

  // Check what's needed at the start
  const mainJsPath = join(repoPath, 'out', 'main.js')
  const nodeModulesPath = join(repoPath, 'node_modules')
  const outPath = join(repoPath, 'out')

  const existsRepoPath = await pathExists(repoPath)
  const existsMainJsPath = await pathExists(mainJsPath)
  const existsNodeModulesPath = await pathExists(nodeModulesPath)
  const existsOutPath = await pathExists(outPath)

  const needsClone = !existsRepoPath
  const needsInstall = !existsMainJsPath && !existsNodeModulesPath
  const needsCompile = !existsMainJsPath && !existsOutPath

  if (!existsReposDir) {
    await mkdir(reposDirPath, { recursive: true })
  }

  // Clone the repository if needed
  if (needsClone) {
    await cloneRepository(repoUrl, repoPath)
    await checkoutCommit(repoPath, commitHash)
  }

  // Install dependencies if needed
  if (needsInstall) {
    console.log(`Installing dependencies for commit ${commitHash}...`)

    // Check if cache exists for this commit hash
    const cacheExists = await checkCacheExists(commitHash, cacheDir)

    if (cacheExists) {
      console.log(`Found cached node_modules for commit ${commitHash}, restoring from cache...`)
      const cacheHit = await setupNodeModulesFromCache(repoPath, commitHash, cacheDir)

      if (!cacheHit) {
        console.log(`Failed to restore from cache, running npm ci for commit ${commitHash}...`)
        // Install dependencies with resource management (use nice on Linux)
        const useNice = platform() === 'linux'
        await InstallDependencies.installDependencies(repoPath, useNice)

        // Cache the node_modules for future use
        await addNodeModulesToCache(repoPath, commitHash, cacheDir)
      } else {
        console.log(`Successfully restored node_modules from cache for commit ${commitHash}`)
      }
    } else {
      console.log(`No cached node_modules found for commit ${commitHash}, running npm ci...`)
      // Install dependencies with resource management (use nice on Linux)
      const useNice = platform() === 'linux'
      await InstallDependencies.installDependencies(repoPath, useNice)

      // Cache the node_modules for future use
      await addNodeModulesToCache(repoPath, commitHash, cacheDir)
    }
  } else if (!existsMainJsPath) {
    console.log(`node_modules already exists in repo for commit ${commitHash}, skipping npm ci...`)
  }

  // Compile if needed
  if (needsCompile) {
    console.log(`Compiling VS Code for commit ${commitHash}...`)
    // Run compilation with resource management (use nice on Linux)
    const useNice = platform() === 'linux'
    await RunCompile.runCompile(repoPath, useNice)
  }

  // Verify build was successful
  if (!(await pathExists(mainJsPath))) {
    throw new Error(`Build failed: out/main.js not found after compilation`)
  }
}
