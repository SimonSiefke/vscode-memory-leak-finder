import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.ts'

export const removeVscodeBackups = async (userDataDir = GetUserDataDir.getUserDataDir()) => {
  const backupsPath = join(userDataDir, 'Backups')
  await rm(backupsPath, {
    force: true,
    recursive: true,
  })
}
