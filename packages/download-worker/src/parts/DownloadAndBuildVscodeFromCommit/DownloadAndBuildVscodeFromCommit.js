import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { execa } from 'execa'
import { VError } from '@lvce-editor/verror'
import * as Root from '../Root/Root.js'

const VSCODE_REPO_URL = 'https://github.com/microsoft/vscode.git'
const VSCODE_REPOS_DIR = '.vscode-repos'

/**
 * @param {string} commitHash
 */
export const downloadAndBuildVscodeFromCommit = async (commitHash) => {
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

      // Clone the repository with depth 1
      await execa('git', ['clone', '--depth', '1', VSCODE_REPO_URL, repoPath])

      // Checkout the specific commit
      await execa('git', ['checkout', commitHash], { cwd: repoPath })
    } else {
      console.log(`VS Code repository for commit ${commitHash} already exists, skipping clone...`)
    }

    // Check if out/main.js exists (build was successful)
    const mainJsPath = join(repoPath, 'out', 'main.js')
    if (!existsSync(mainJsPath)) {
      console.log(`Building VS Code for commit ${commitHash}...`)

      // Run npm ci
      await execa('npm', ['ci'], { cwd: repoPath })

      // Run npm run compile
      await execa('npm', ['run', 'compile'], { cwd: repoPath })

      // Verify build was successful
      if (!existsSync(mainJsPath)) {
        throw new Error(`Build failed: out/main.js not found after compilation`)
      }
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
