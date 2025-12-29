import { exec } from '../Exec/Exec.ts'
import { VError } from '@lvce-editor/verror'

export const installNodeVersion = async (version: string): Promise<string> => {
  try {
    // nvm is a bash function, so we need to source it first
    // Try common nvm installation locations
    const nvmSourceCommand = 'source ~/.nvm/nvm.sh 2>/dev/null || source ~/.config/nvm/nvm.sh 2>/dev/null; '

    // Install and use the node version
    const installResult = await exec(
      'bash',
      ['-c', `${nvmSourceCommand}nvm install ${version} && nvm use ${version} && node --version`],
      {},
    )
    if (installResult.exitCode !== 0) {
      throw new Error(`Failed to install node version ${version}: ${installResult.stderr}`)
    }

    const installedVersion = installResult.stdout.trim()
    return installedVersion
  } catch (error) {
    throw new VError(error, `Failed to install node version '${version}'`)
  }
}
