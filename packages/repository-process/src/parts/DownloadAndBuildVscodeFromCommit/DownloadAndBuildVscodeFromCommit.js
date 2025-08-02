import { join } from 'node:path'
import { access } from 'node:fs/promises'
import { platform } from 'node:os'
import { VError } from '@lvce-editor/verror'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.js'
import { setupNodeModulesFromCache } from '../SetupNodeModulesFromCache/SetupNodeModulesFromCache.js'
import { cacheNodeModules } from '../CacheNodeModules/CacheNodeModules.js'
import { cleanupNodeModules } from '../CleanupNodeModules/CleanupNodeModules.js'
import * as DownloadVscodeCommit from '../DownloadVscodeCommit/DownloadVscodeCommit.js'
import * as InstallDependencies from '../InstallDependencies/InstallDependencies.js'
import * as RunCompile from '../RunCompile/RunCompile.js'

const VSCODE_REPO_URL = 'https://github.com/microsoft/vscode.git'
const VSCODE_REPOS_DIR = '.vscode-repos'

/**
 * Checks if a file or directory exists
 * @param {string} path - The path to check
 * @returns {Promise<boolean>} True if the path exists, false otherwise
 */
const exists = async (path) => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * @param {string} commitRef - The commit reference (branch name, tag, or commit hash)
 */
export const downloadAndBuildVscodeFromCommit = async (commitRef) => {
  // Resolve the commit reference to an actual commit hash
  const commitHash = await ResolveCommitHash.resolveCommitHash(commitRef)
  try {
    const repoPath = await DownloadVscodeCommit.downloadVscodeCommit(VSCODE_REPO_URL, commitHash, VSCODE_REPOS_DIR)

    // Check if out/main.js exists (build was successful)
    const mainJsPath = join(repoPath, 'out', 'main.js')
    const nodeModulesPath = join(repoPath, 'node_modules')
    const outPath = join(repoPath, 'out')

    if (!(await exists(mainJsPath))) {
      console.log(`Building VS Code for commit ${commitHash}...`)

      // Check if node_modules exists in the repo
      if (!(await exists(nodeModulesPath))) {
        console.log(`node_modules not found in repo, attempting to restore from cache...`)

        // Try to use cached node_modules first
        const cacheHit = await setupNodeModulesFromCache(repoPath)

        if (!cacheHit) {
          console.log(`No cached node_modules found, running npm ci for commit ${commitHash}...`)
          // Install dependencies with resource management (use nice on Linux)
          const useNice = platform() === 'linux'
          await InstallDependencies.installDependencies(repoPath, useNice)

          // Cache the node_modules for future use
          await cacheNodeModules(repoPath)
        } else {
          console.log(`Successfully restored node_modules from cache for commit ${commitHash}`)
        }
      } else {
        console.log(`node_modules already exists in repo for commit ${commitHash}, skipping npm ci...`)
      }

      // Check if out folder exists before attempting to compile
      if (!(await exists(outPath))) {
        console.log(`out folder not found, running npm run compile for commit ${commitHash}...`)
        // Run compilation with resource management (use nice on Linux)
        const useNice = platform() === 'linux'
        await RunCompile.runCompile(repoPath, useNice)
      } else {
        console.log(`out folder already exists for commit ${commitHash}, skipping compilation...`)
      }

      // Verify build was successful
      if (!(await exists(mainJsPath))) {
        throw new Error(`Build failed: out/main.js not found after compilation`)
      }

      // Clean up node_modules to save disk space
      cleanupNodeModules(repoPath)
    } else {
      console.log(`VS Code build for commit ${commitHash} already exists, skipping build...`)
    }

    // Return the path to the code.sh script
    const codeScriptPath = join(repoPath, 'scripts', 'code.sh')
    if (!(await exists(codeScriptPath))) {
      throw new Error(`VS Code script not found at ${codeScriptPath}`)
    }

    return codeScriptPath
  } catch (error) {
    throw new VError(error, `Failed to download and build VS Code from commit ${commitHash}`)
  }
}
