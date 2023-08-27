import { join } from 'node:path'
import * as Root from '../Root/Root.js'
import { rm } from 'node:fs/promises'

export const removeVscodeBackups = async () => {
  const backupsPath = join(Root.root, '.vscode-user-data-dir', 'Backups')
  await rm(backupsPath, {
    recursive: true,
    force: true,
  })
}
