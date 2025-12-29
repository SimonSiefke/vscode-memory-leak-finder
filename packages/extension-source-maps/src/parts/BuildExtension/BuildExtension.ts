import { exec } from '../Exec/Exec.ts'
import { VError } from '@lvce-editor/verror'

export const buildExtension = async (repoPath: string, nodeVersion: string): Promise<void> => {
  try {
    // Use nvm to switch to the correct node version and run npm ci
    const npmCiResult = await exec('bash', ['-c', `source ~/.nvm/nvm.sh && nvm use ${nodeVersion} && npm ci`], {
      cwd: repoPath,
    })
    if (npmCiResult.exitCode !== 0) {
      throw new Error(`npm ci failed: ${npmCiResult.stderr}`)
    }

    // Run the build command
    const buildResult = await exec('bash', ['-c', `source ~/.nvm/nvm.sh && nvm use ${nodeVersion} && npm run compile`], {
      cwd: repoPath,
    })
    if (buildResult.exitCode !== 0) {
      // Try 'build' if 'compile' fails
      const buildResult2 = await exec('bash', ['-c', `source ~/.nvm/nvm.sh && nvm use ${nodeVersion} && npm run build`], {
        cwd: repoPath,
      })
      if (buildResult2.exitCode !== 0) {
        throw new Error(`Build failed: ${buildResult2.stderr}`)
      }
    }
  } catch (error) {
    throw new VError(error, `Failed to build extension in '${repoPath}'`)
  }
}

