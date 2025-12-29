import { exec } from '../Exec/Exec.ts'
import { VError } from '@lvce-editor/verror'

export const installNodeVersion = async (version: string): Promise<string> => {
  try {
    // Check if nvm is available
    const nvmCheckResult = await exec('bash', ['-c', 'command -v nvm'], {})
    if (nvmCheckResult.exitCode !== 0) {
      // Try to source nvm if it exists
      const nvmSourceResult = await exec('bash', ['-c', 'source ~/.nvm/nvm.sh && command -v nvm'], {})
      if (nvmSourceResult.exitCode !== 0) {
        throw new Error('nvm is not available. Please install nvm to use this feature.')
      }
    }

    // Install and use the node version
    const installResult = await exec('bash', ['-c', `source ~/.nvm/nvm.sh && nvm install ${version} && nvm use ${version} && node --version`], {})
    if (installResult.exitCode !== 0) {
      throw new Error(`Failed to install node version ${version}`)
    }

    const installedVersion = installResult.stdout.trim()
    return installedVersion
  } catch (error) {
    throw new VError(error, `Failed to install node version '${version}'`)
  }
}

