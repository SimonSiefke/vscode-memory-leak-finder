// based on microsoft/playwright/packages/playwright-core/src/utils/hostPlatform.ts (License Apache 2.0)

import * as os from 'node:os'

export const getHostPlatform = () => {
  const ver = os
    .release()
    .split('.')
    .map((a) => parseInt(a, 10))
  let macVersion = ''
  if (ver[0] < 18) {
    // Everything before 10.14 is considered 10.13.
    macVersion = 'mac10.13'
  } else if (ver[0] === 18) {
    macVersion = 'mac10.14'
  } else if (ver[0] === 19) {
    macVersion = 'mac10.15'
  } else {
    // ver[0] >= 20
    const LAST_STABLE_MAC_MAJOR_VERSION = 13
    // Best-effort support for MacOS beta versions.
    macVersion = 'mac' + Math.min(ver[0] - 9, LAST_STABLE_MAC_MAJOR_VERSION)
    // BigSur is the first version that might run on Apple Silicon.
    if (os.cpus().some((cpu) => cpu.model.includes('Apple'))) macVersion += '-arm64'
  }
  return macVersion
}
