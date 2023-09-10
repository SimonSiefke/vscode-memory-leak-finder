// based on microsoft/playwright/packages/playwright-core/src/utils/hostPlatform.ts (License Apache 2.0)

import os from 'node:os'
import * as GetLinuxDistributionInfo from '../GetLinuxDistributionInfo/GetLinuxDistibutionInfo.js'

export const getHostPlatform = async () => {
  const archSuffix = os.arch() === 'arm64' ? '-arm64' : ''
  const distroInfo = await GetLinuxDistributionInfo.getLinuxDistributionInfo()

  // Pop!_OS is ubuntu-based and has the same versions.
  // KDE Neon is ubuntu-based and has the same versions.
  // TUXEDO OS is ubuntu-based and has the same versions.
  if (distroInfo?.id === 'ubuntu' || distroInfo?.id === 'pop' || distroInfo?.id === 'neon' || distroInfo?.id === 'tuxedo') {
    if (parseInt(distroInfo.version, 10) <= 19) {
      return 'ubuntu18.04' + archSuffix
    }
    if (parseInt(distroInfo.version, 10) <= 21) {
      return 'ubuntu20.04' + archSuffix
    }
    return 'ubuntu22.04' + archSuffix
  }
  if (distroInfo?.id === 'debian' && distroInfo?.version === '11') {
    return 'debian11' + archSuffix
  }
  if (distroInfo?.id === 'debian' && distroInfo?.version === '12') {
    return 'debian12' + archSuffix
  }
  return 'generic-linux' + archSuffix
}
