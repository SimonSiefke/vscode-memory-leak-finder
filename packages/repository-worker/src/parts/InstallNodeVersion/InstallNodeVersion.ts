import { exec } from '../Exec/Exec.ts'
import * as Logger from '../Logger/Logger.ts'

const nvmSourceCommand =
  'if [ -n "${NVM_DIR:-}" ] && [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh"; elif [ -s "$HOME/.nvm/nvm.sh" ]; then export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; elif [ -s "$HOME/.config/nvm/nvm.sh" ]; then export NVM_DIR="$HOME/.config/nvm"; . "$NVM_DIR/nvm.sh"; else echo "nvm.sh not found" >&2; exit 1; fi; '

export const installNodeVersion = async (nodeVersion: string): Promise<void> => {
  Logger.log(`[repository] Node.js v${nodeVersion} not found in nvm, running nvm install ${nodeVersion}...`)
  const result = await exec('bash', ['-c', `${nvmSourceCommand}nvm install ${nodeVersion}`], {})
  if (result.exitCode !== 0) {
    throw new Error(`Failed to install node version ${nodeVersion}: ${result.stderr}`)
  }
}
