import * as Logger from '../Logger/Logger.ts'
import * as Nvm from '../Nvm/Nvm.ts'

export const installNodeVersion = async (nodeVersion: string): Promise<void> => {
  Logger.log(`[repository] Node.js v${nodeVersion} not found in nvm, running nvm install ${nodeVersion}...`)
  const result = await Nvm.exec('install', nodeVersion)
  if (result.exitCode !== 0) {
    throw new Error(`Failed to install node version ${nodeVersion}: ${result.stderr}`)
  }
}
