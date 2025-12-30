import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'

export const installNodeVersion = async (version: string): Promise<string> => {
  try {
    // nvm is a bash function, so we need to source it first
    // Try common nvm installation locations
    const nvmSourceCommand = 'source ~/.nvm/nvm.sh 2>/dev/null || source ~/.config/nvm/nvm.sh 2>/dev/null; '

    // Check if the version is already installed by checking if the version directory exists
    // nvm stores node versions in ~/.nvm/versions/node/v<version> or ~/.config/nvm/versions/node/v<version>
    const checkCommand = `${nvmSourceCommand}NVM_DIR="$([ -z "\${NVM_DIR:-}" ] && echo ~/.nvm || echo "\${NVM_DIR:-}")"; if [ -d "$NVM_DIR/versions/node/v${version}" ]; then echo "installed"; elif [ -d ~/.config/nvm/versions/node/v${version} ]; then echo "installed"; else echo "not_installed"; fi`

    const checkResult = await exec('bash', ['-c', checkCommand], {})
    if (checkResult.exitCode !== 0) {
      throw new Error(`Failed to install node version ${version}: ${checkResult.stderr}`)
    }

    const isInstalled = checkResult.stdout.trim() === 'installed'

    // Install only if not already installed
    if (!isInstalled) {
      const installResult = await exec('bash', ['-c', `${nvmSourceCommand}nvm install ${version}`], {})
      if (installResult.exitCode !== 0) {
        throw new Error(`Failed to install node version ${version}: ${installResult.stderr}`)
      }
    }

    // Use the node version and get the installed version
    const useResult = await exec('bash', ['-c', `${nvmSourceCommand}nvm use ${version} && node --version`], {})
    if (useResult.exitCode !== 0) {
      throw new Error(`Failed to use node version ${version}: ${useResult.stderr}`)
    }

    const installedVersion = useResult.stdout.trim()
    return installedVersion
  } catch (error) {
    throw new VError(error, `Failed to install node version '${version}'`)
  }
}
