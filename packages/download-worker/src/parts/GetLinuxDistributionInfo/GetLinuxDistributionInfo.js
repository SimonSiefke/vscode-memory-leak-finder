// based on microsoft/playwright/packages/playwright-core/src/utils/hostPlatform.ts (License Apache 2.0)

import * as fs from 'node:fs/promises'
import * as ParseOsReleaseText from '../ParseOsReleaseText/ParseOsReleaseText.js'

export const getLinuxDistributionInfo = async () => {
  if (process.platform !== 'linux') {
    return undefined
  }
  try {
    // List of /etc/os-release values for different distributions could be
    // found here: https://gist.github.com/aslushnikov/8ceddb8288e4cf9db3039c02e0f4fb75
    const osReleaseText = await fs.readFile('/etc/os-release', 'utf8')
    const fields = ParseOsReleaseText.parseOSReleaseText(osReleaseText)
    return {
      id: fields['id'] ?? '',
      version: fields['version_id'] ?? '',
    }
  } catch {
    return undefined
  }
}
