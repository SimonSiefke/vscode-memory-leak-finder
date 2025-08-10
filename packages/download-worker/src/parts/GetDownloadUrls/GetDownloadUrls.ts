// based on microsoft/playwright/packages/playwright-core/src/server/registry/index.ts (License Apache 2.0)

import * as CreateUrls from '../CreateUrls/CreateUrls.ts'
import * as GetDownloadUrl from '../GetDownloadUrl/GetDownloadUrl.ts'
import * as PlaywrightCdnMirrors from '../PlaywrightCdnMirrors/PlaywrightCdnMirrors.ts'

export const getDownloadUrls = (name: string, revision: string, hostPlatform: string): string[] => {
  const downloadPath = GetDownloadUrl.getDownloadUrl(name, revision, hostPlatform)
  if (!downloadPath) {
    return []
  }
  const urls = CreateUrls.createUrls(PlaywrightCdnMirrors.playwrightCdnMirrors, downloadPath)
  return urls
}
