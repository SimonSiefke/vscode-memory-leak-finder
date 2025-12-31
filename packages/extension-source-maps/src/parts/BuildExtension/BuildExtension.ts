import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'

export const buildExtension = async (repoPath: string, nodeVersion: string, platform?: string): Promise<void> => {
  if (platform === 'win32') {
    throw new Error('Windows is not supported for this operation')
  }
  try {
    // nvm is a bash function, so we need to source it first
    // Try common nvm installation locations
    const nvmSourceCommand = 'source ~/.nvm/nvm.sh 2>/dev/null || source ~/.config/nvm/nvm.sh 2>/dev/null; '

    const buildResult2 = await exec('bash', ['-c', `${nvmSourceCommand}nvm use ${nodeVersion} && npm run build`], {
      cwd: repoPath,
    })
    if (buildResult2.exitCode !== 0) {
      throw new Error(`Build failed: ${buildResult2.stderr}`)
    }
  } catch (error) {
    throw new VError(error, `Failed to build extension in '${repoPath}'`)
  }
}
