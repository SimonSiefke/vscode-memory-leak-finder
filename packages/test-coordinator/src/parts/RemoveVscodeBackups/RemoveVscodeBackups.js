import { join } from 'node:path'
import { rm } from 'node:fs/promises'
import * as Root from '../Root/Root.js'

export const removeVscodeBackups = async () => {
  const backupsPath = join(Root.root, '.vscode-user-data-dir', 'Backups')
  await rm(backupsPath, {
    recursive: true,
    force: true,
  })
}
