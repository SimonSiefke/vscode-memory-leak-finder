// based on microsoft/playwright/packages/playwright-core/src/server/registry/index.ts (License Apache 2.0)
import * as ExecutablePaths from '../ExecutablePaths/ExecutablePaths.js'
import * as GetExecutablePathKey from '../GetExecutablePathKey/GetExecutablePathKey.js'

export const getExecutablePath = (name) => {
  const osPaths = ExecutablePaths[name]
  const key = GetExecutablePathKey.getExecutablePathKey(process.platform)
  const osPath = osPaths[key]
  return osPath
}
