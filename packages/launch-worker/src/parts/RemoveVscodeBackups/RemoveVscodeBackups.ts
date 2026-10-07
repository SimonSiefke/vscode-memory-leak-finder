import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.ts'

export const removeVscodeBackups = async () => {
  const backupsPath = join(GetUserDataDir.getUserDataDir(), 'Backups')
  await rm(backupsPath, {
    force: true,
    recursive: true,
  })
}
