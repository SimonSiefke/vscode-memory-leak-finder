// based on microsoft/playwright/packages/playwright-core/src/server/registry/index.ts (License Apache 2.0)

import { format } from 'node:util'
import * as DownloadPaths from '../DownloadPaths/DownloadPaths.js'

export const getDownloadUrl = (name: string, revision: string, hostPlatform: string): string => {
  const template = DownloadPaths.downloadPaths[name][hostPlatform]
  if (!template) {
    return ''
  }
  const downloadPath = format(template, revision)
  return downloadPath
}
