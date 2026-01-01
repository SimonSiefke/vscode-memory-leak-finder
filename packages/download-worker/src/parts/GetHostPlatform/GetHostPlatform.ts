// based on microsoft/playwright/packages/playwright-core/src/utils/hostPlatform.ts (License Apache 2.0)

import { VError } from '@lvce-editor/verror'
import * as GetHostPlatformModule from '../GetHostPlatformModule/GetHostPlatformModule.ts'

export const getHostPlatform = async (platform: string, arch: string): Promise<string> => {
  try {
    const fn = GetHostPlatformModule.getHostPlatformModule(platform)
    const hostPlatform = await fn(arch)
    return hostPlatform
  } catch (error) {
    throw new VError(error, `Failed to determine host platform`)
  }
}
