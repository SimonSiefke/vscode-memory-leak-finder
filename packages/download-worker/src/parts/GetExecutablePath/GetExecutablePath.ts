// based on microsoft/playwright/packages/playwright-core/src/server/registry/index.ts (License Apache 2.0)
import * as ExecutablePaths from '../ExecutablePaths/ExecutablePaths.ts'
import * as GetExecutablePathKey from '../GetExecutablePathKey/GetExecutablePathKey.ts'

export const getExecutablePath = (platform: string, name: string): string[] => {
  const osPaths = (ExecutablePaths as Record<string, Record<string, string[]>>)[name]
  const key = GetExecutablePathKey.getExecutablePathKey(platform)
  const osPath = osPaths[key]
  return osPath
}
