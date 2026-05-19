import { exec } from '../Exec/Exec.ts'
import * as Logger from '../Logger/Logger.ts'
import * as Path from '../Path/Path.ts'

const nvmSourceCommand =
  'if [ -n "${NVM_DIR:-}" ] && [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh"; elif [ -s "$HOME/.nvm/nvm.sh" ]; then export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; elif [ -s "$HOME/.config/nvm/nvm.sh" ]; then export NVM_DIR="$HOME/.config/nvm"; . "$NVM_DIR/nvm.sh"; else echo "nvm.sh not found" >&2; exit 1; fi; '

export const installNodeVersion = async (nodeVersion: string): Promise<void> => {
  Logger.log(`[repository] Node.js v${nodeVersion} not found in nvm, running nvm install ${nodeVersion}...`)
  const result =
    process.platform === 'win32'
      ? await exec(process.env.NVM_HOME ? Path.join(process.env.NVM_HOME, 'nvm.exe') : 'nvm', ['install', nodeVersion], {})
      : await exec('bash', ['-c', `${nvmSourceCommand}nvm install ${nodeVersion}`], {})
  if (result.exitCode !== 0) {
    throw new Error(`Failed to install node version ${nodeVersion}: ${result.stderr}`)
  }
}
