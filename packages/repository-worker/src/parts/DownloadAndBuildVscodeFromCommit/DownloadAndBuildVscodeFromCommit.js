import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { platform } from 'node:os'
import { VError } from '@lvce-editor/verror'
import { pathExists } from 'path-exists'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.js'
import { setupNodeModulesFromCache } from '../SetupNodeModulesFromCache/SetupNodeModulesFromCache.js'
import { addNodeModulesToCache } from '../CacheNodeModules/CacheNodeModules.js'
import { cleanupNodeModules } from '../CleanupNodeModules/CleanupNodeModules.js'
import { cloneRepository } from '../CloneRepository/CloneRepository.js'
import { checkoutCommit } from '../CheckoutCommit/CheckoutCommit.js'
import * as Root from '../Root/Root.js'
import * as InstallDependencies from '../InstallDependencies/InstallDependencies.js'
import * as RunCompile from '../RunCompile/RunCompile.js'

const VSCODE_REPO_URL = 'https://github.com/microsoft/vscode.git'
const VSCODE_REPOS_DIR = '.vscode-repos'

/**
 * @param {string} commitRef - The commit reference (branch name, tag, or commit hash)
 */
export const downloadAndBuildVscodeFromCommit = async (commitRef) => {
  // Resolve the commit reference to an actual commit hash
  const commitHash = await ResolveCommitHash.resolveCommitHash(VSCODE_REPO_URL, commitRef)
  const reposDir = join(Root.root, VSCODE_REPOS_DIR)
  const repoPath = join(reposDir, commitHash)

  // Create parent directory if it doesn't exist
  if (!(await pathExists(reposDir))) {
    await mkdir(reposDir, { recursive: true })
  }

  // Check what's needed at the start
  const mainJsPath = join(repoPath, 'out', 'main.js')
  const nodeModulesPath = join(repoPath, 'node_modules')
  const outPath = join(repoPath, 'out')

  const needsClone = !(await pathExists(repoPath))
  const needsInstall = !(await pathExists(mainJsPath)) && !(await pathExists(nodeModulesPath))
  const needsCompile = !(await pathExists(mainJsPath)) && !(await pathExists(outPath))

  // Clone the repository if needed
  if (needsClone) {
    await cloneRepository(VSCODE_REPO_URL, repoPath)
    await checkoutCommit(repoPath, commitHash)
  }

  // Install dependencies if needed
  if (needsInstall) {
    console.log(`Installing dependencies for commit ${commitHash}...`)

    // Try to use cached node_modules first
    const cacheHit = await setupNodeModulesFromCache(repoPath)

    if (!cacheHit) {
      console.log(`No cached node_modules found, running npm ci for commit ${commitHash}...`)
      // Install dependencies with resource management (use nice on Linux)
      const useNice = platform() === 'linux'
      await InstallDependencies.installDependencies(repoPath, useNice)

      // Cache the node_modules for future use
      await addNodeModulesToCache(repoPath)
    } else {
      console.log(`Successfully restored node_modules from cache for commit ${commitHash}`)
    }
  } else if (!(await pathExists(mainJsPath))) {
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

  // Clean up node_modules to save disk space
  cleanupNodeModules(repoPath)

  // Return the path to the code.sh script
  const codeScriptPath = join(repoPath, 'scripts', 'code.sh')
  if (!(await pathExists(codeScriptPath))) {
    throw new Error(`VS Code script not found at ${codeScriptPath}`)
  }

  return codeScriptPath
}
