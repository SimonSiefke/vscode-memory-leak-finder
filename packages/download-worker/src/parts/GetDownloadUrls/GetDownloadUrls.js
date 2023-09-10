// based on microsoft/playwright/packages/playwright-core/src/server/registry/index.ts (License Apache 2.0)

import * as CreateUrls from '../CreateUrls/CreateUrls.js'
import * as GetDownloadUrl from '../GetDownloadUrl/GetDownloadUrl.js'
import * as PlaywrightCdnMirrors from '../PlaywrightCdnMirrors/PlaywrightCdnMirrors.js'

export const getDownloadUrls = (name, revision, hostPlatform) => {
  const downloadPath = GetDownloadUrl.getDownloadUrl(name, revision, hostPlatform)
  if (!downloadPath) {
    return []
  }
  const urls = CreateUrls.createUrls(PlaywrightCdnMirrors.playwrightCdnMirrors, downloadPath)
  return urls
}
