// based on microsoft/playwright/packages/playwright-core/src/server/registry/index.ts (License Apache 2.0)
import * as ExecutablePaths from '../ExecutablePaths/ExecutablePaths.js'

const getExecutablePathKey = (platform) => {
  switch (platform) {
    case 'linux':
      return 'linux'
    case 'darwin':
      return 'mac'
    case 'win32':
      return 'win'
    default:
      return ''
  }
}

export const getExecutablePath = (name) => {
  const osPaths = ExecutablePaths[name]
  const key = getExecutablePathKey(process.platform)
  const osPath = osPaths[key]
  return osPath
}
