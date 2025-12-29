import { exec } from '../Exec/Exec.ts'
import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export const installDependencies = async (repoPath: string, nodeVersion: string): Promise<void> => {
  try {
    const homeDir = homedir()
    // Try common nvm installation locations
    const nvmDirs = [join(homeDir, '.nvm'), join(homeDir, '.config', 'nvm')]
    
    let npmPath: string | undefined
    for (const nvmDir of nvmDirs) {
      const candidateNpmPath = join(nvmDir, 'versions', 'node', `v${nodeVersion}`, 'bin', 'npm')
      if (existsSync(candidateNpmPath)) {
        npmPath = candidateNpmPath
        break
      }
    }

    if (!npmPath) {
      throw new Error(`Could not find npm for node version ${nodeVersion} in nvm directories`)
    }

    // Run npm ci using the correct npm path
    const npmCiResult = await exec(npmPath, ['ci'], {
      cwd: repoPath,
    })
    if (npmCiResult.exitCode !== 0) {
      throw new Error(`npm ci failed: ${npmCiResult.stderr}`)
    }
  } catch (error) {
    throw new VError(error, `Failed to install dependencies in '${repoPath}'`)
  }
}

