import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { exec } from '../Exec/Exec.ts'

export const installDependencies = async (repoPath: string, nodeVersion: string): Promise<void> => {
  try {
    // Check if node_modules already exists
    const nodeModulesPath = join(repoPath, 'node_modules')
    if (existsSync(nodeModulesPath)) {
      return
    }

    // nvm is a bash function, so we need to source it first
    // Try common nvm installation locations
    const nvmSourceCommand = 'source ~/.nvm/nvm.sh 2>/dev/null || source ~/.config/nvm/nvm.sh 2>/dev/null; '

    // Find npm path for the installed node version
    // nvm stores node versions in ~/.nvm/versions/node/v<version>/bin/npm or ~/.config/nvm/versions/node/v<version>/bin/npm
    const findNpmPathCommand = `${nvmSourceCommand}NVM_DIR="$([ -z "\${NVM_DIR:-}" ] && echo ~/.nvm || echo "\${NVM_DIR:-}")"; if [ -d "$NVM_DIR/versions/node/v${nodeVersion}" ]; then echo "$NVM_DIR/versions/node/v${nodeVersion}/bin/npm"; elif [ -d ~/.config/nvm/versions/node/v${nodeVersion} ]; then echo ~/.config/nvm/versions/node/v${nodeVersion}/bin/npm; else exit 1; fi`

    const findNpmResult = await exec('bash', ['-c', findNpmPathCommand], {})
    if (findNpmResult.exitCode !== 0) {
      throw new Error(`Could not find npm for node version ${nodeVersion} in nvm directories`)
    }

    const npmPath = findNpmResult.stdout.trim()
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
