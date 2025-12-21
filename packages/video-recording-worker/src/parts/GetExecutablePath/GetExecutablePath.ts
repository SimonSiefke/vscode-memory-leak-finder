// based on microsoft/playwright/packages/playwright-core/src/server/registry/index.ts (License Apache 2.0)
import * as ExecutablePaths from '../ExecutablePaths/ExecutablePaths.ts'
import * as GetExecutablePathKey from '../GetExecutablePathKey/GetExecutablePathKey.ts'

export const getExecutablePath = (name: 'ffmpeg'): string => {
  const osPaths = ExecutablePaths[name]
  const key = GetExecutablePathKey.getExecutablePathKey(process.platform)
  // @ts-ignore
  const osPath = osPaths[key]
  return osPath
}
