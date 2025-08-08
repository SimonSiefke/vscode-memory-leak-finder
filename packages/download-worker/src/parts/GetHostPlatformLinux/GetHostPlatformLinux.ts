// based on microsoft/playwright/packages/playwright-core/src/utils/hostPlatform.ts (License Apache 2.0)

import * as GetLinuxDistributionInfo from '../GetLinuxDistributionInfo/GetLinuxDistributionInfo.ts'
import * as os from 'node:os'

export const getHostPlatform = async (): Promise<string> => {
  const osArch = os.arch()
  const archSuffix = osArch === 'arm64' ? '-arm64' : '-x64'
  const distroInfo = await GetLinuxDistributionInfo.getLinuxDistributionInfo()
  const major = parseInt(distroInfo?.version || '0', 10)
  // Pop!_OS is ubuntu-based and has the same versions.
  // KDE Neon is ubuntu-based and has the same versions.
  // TUXEDO OS is ubuntu-based and has the same versions.
  if (distroInfo?.id === 'ubuntu' || distroInfo?.id === 'pop' || distroInfo?.id === 'neon' || distroInfo?.id === 'tuxedo') {
    if (major <= 19) {
      return 'ubuntu18.04' + archSuffix
    }
    if (major <= 21) {
      return 'ubuntu20.04' + archSuffix
    }
    if (major < 23) {
      return 'ubuntu22.04' + archSuffix
    }
    return 'ubuntu24.04' + archSuffix
  }
  if (distroInfo?.id === 'debian' && distroInfo?.version === '11') {
    return 'debian11' + archSuffix
  }
  if (distroInfo?.id === 'debian' && distroInfo?.version === '12') {
    return 'debian12' + archSuffix
  }
  return 'generic-linux' + archSuffix
}
