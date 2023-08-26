import { join } from 'node:path'
import * as Root from '../Root/Root.js'
import { rm } from 'node:fs/promises'

export const removeVsCodeWorkspaceStorage = async () => {
  const workspaceStoragePath = join(Root.root, '.vscode-user-data-dir', 'User', 'workspaceStorage')
  await rm(workspaceStoragePath, {
    recursive: true,
    force: true,
  })
}
