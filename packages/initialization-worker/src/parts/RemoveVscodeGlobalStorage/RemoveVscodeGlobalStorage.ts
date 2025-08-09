import { join } from 'node:path'
import { rm } from 'node:fs/promises'
import * as Root from '../Root/Root.ts'

export const removeVsCodeGlobalStorage = async () => {
  const workspaceStoragePath = join(Root.root, '.vscode-user-data-dir', 'User', 'globalStorage')
  await rm(workspaceStoragePath, {
    recursive: true,
    force: true,
  })
}
