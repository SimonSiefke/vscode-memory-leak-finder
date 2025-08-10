// based on microsoft/playwright/packages/playwright-core/src/utils/hostPlatform.ts (License Apache 2.0)

import { VError } from '@lvce-editor/verror'
import * as GetHostPlatformModule from '../GetHostPlatformModule/GetHostPlatformModule.ts'

export const getHostPlatform = async (platform: string): Promise<string> => {
  try {
    const module = await GetHostPlatformModule.getHostPlatformModule(platform)
    const hostPlatform = await module.getHostPlatform()
    return hostPlatform
  } catch (error) {
    throw new VError(error, `Failed to determine host platform`)
  }
}
