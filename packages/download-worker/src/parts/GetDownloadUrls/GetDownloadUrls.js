// based on microsoft/playwright/packages/playwright-core/src/server/registry/index.ts (License Apache 2.0)

import { format } from 'node:util'
import * as CreateUrls from '../CreateUrls/CreateUrls.js'
import * as DownloadPaths from '../DownloadPaths/DownloadPaths.js'
import * as PlaywrightCdnMirrors from '../PlaywrightCdnMirrors/PlaywrightCdnMirrors.js'

export const getDownloadUrls = (name, revision, hostPlatform) => {
  const template = DownloadPaths.downloadPaths[name][hostPlatform]
  if (!template) {
    return []
  }
  const downloadPath = format(template, revision)
  const urls = CreateUrls.createUrls(PlaywrightCdnMirrors.playwrightCdnMirrors, downloadPath)
  return urls
}
