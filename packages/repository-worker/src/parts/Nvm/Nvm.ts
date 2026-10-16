import { exec as execute } from '../Exec/Exec.ts'

const nvmSourceCommand =
  'if [ -n "${NVM_DIR:-}" ] && [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh" --no-use; elif [ -s "$HOME/.nvm/nvm.sh" ]; then export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh" --no-use; elif [ -s "$HOME/.config/nvm/nvm.sh" ]; then export NVM_DIR="$HOME/.config/nvm"; . "$NVM_DIR/nvm.sh" --no-use; else echo "nvm.sh not found" >&2; exit 1; fi; '

export const exec = (command: 'install' | 'version', nodeVersion: string): ReturnType<typeof execute> => {
  return execute('bash', ['-c', `${nvmSourceCommand}nvm ${command} "$1"`, 'nvm', nodeVersion], { reject: false })
}

export const resolveVersion = async (nodeVersion: string): Promise<string | undefined> => {
  const result = await exec('version', nodeVersion)
  const resolvedVersion = result.stdout.trim().replace(/^v/, '')
  return result.exitCode === 0 && /^\d+\.\d+\.\d+$/.test(resolvedVersion) ? resolvedVersion : undefined
}
