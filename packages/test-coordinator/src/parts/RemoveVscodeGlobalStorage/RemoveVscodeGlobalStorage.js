import { join } from 'node:path'
import * as Root from '../Root/Root.js'
import { rm } from 'node:fs/promises'

export const removeVsCodeGlobalStorage = async () => {
  const workspaceStoragePath = join(Root.root, '.vscode-user-data-dir', 'User', 'globalStorage')
  await rm(workspaceStoragePath, {
    recursive: true,
    force: true,
  })
}
