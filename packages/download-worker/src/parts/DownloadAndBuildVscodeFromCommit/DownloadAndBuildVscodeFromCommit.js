import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { execa } from 'execa'
import { VError } from '@lvce-editor/verror'
import * as Root from '../Root/Root.js'
import * as VscodeNodeModulesCache from '../VscodeNodeModulesCache/VscodeNodeModulesCache.js'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.js'

const VSCODE_REPO_URL = 'https://github.com/microsoft/vscode.git'
const VSCODE_REPOS_DIR = '.vscode-repos'

/**
 * @param {string} commitRef - The commit reference (branch name, tag, or commit hash)
 */
export const downloadAndBuildVscodeFromCommit = async (commitRef) => {
  // Resolve the commit reference to an actual commit hash
  const commitHash = await ResolveCommitHash.resolveCommitHash(commitRef)
  try {
    const reposDir = join(Root.root, VSCODE_REPOS_DIR)
    const repoPath = join(reposDir, commitHash)

    // Create repos directory if it doesn't exist
    if (!existsSync(reposDir)) {
      mkdirSync(reposDir, { recursive: true })
    }

    // Check if repo already exists
    if (!existsSync(repoPath)) {
      console.log(`Cloning VS Code repository for commit ${commitHash}...`)

      // Clone the repository first
      await execa('git', ['clone', '--depth', '1', VSCODE_REPO_URL, repoPath])

      // Then checkout the specific commit
      await execa('git', ['checkout', commitHash], { cwd: repoPath })
    } else {
      console.log(`VS Code repository for commit ${commitHash} already exists, skipping clone...`)
    }

    // Check if out/main.js exists (build was successful)
    const mainJsPath = join(repoPath, 'out', 'main.js')
    if (!existsSync(mainJsPath)) {
      console.log(`Building VS Code for commit ${commitHash}...`)

      // Try to use cached node_modules first
      const cacheHit = await VscodeNodeModulesCache.setupNodeModulesFromCache(repoPath)

      if (!cacheHit) {
        console.log(`Running npm ci for commit ${commitHash}...`)
        // Run npm ci
        await execa('npm', ['ci'], { cwd: repoPath })

        // Cache the node_modules for future use
        await VscodeNodeModulesCache.cacheNodeModules(repoPath)
      } else {
        console.log(`Using cached node_modules for commit ${commitHash}`)
      }

      console.log(`Running npm run compile for commit ${commitHash}...`)
      // Run npm run compile
      await execa('npm', ['run', 'compile'], { cwd: repoPath })

      // Verify build was successful
      if (!existsSync(mainJsPath)) {
        throw new Error(`Build failed: out/main.js not found after compilation`)
      }

      // Clean up node_modules to save disk space
      VscodeNodeModulesCache.cleanupNodeModules(repoPath)
    } else {
      console.log(`VS Code build for commit ${commitHash} already exists, skipping build...`)
    }

    // Return the path to the code.sh script
    const codeScriptPath = join(repoPath, 'scripts', 'code.sh')
    if (!existsSync(codeScriptPath)) {
      throw new Error(`VS Code script not found at ${codeScriptPath}`)
    }

    return codeScriptPath
  } catch (error) {
    throw new VError(error, `Failed to download and build VS Code from commit ${commitHash}`)
  }
}
