import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.ts'

export const removeVsCodeGlobalStorage = async (userDataDir = GetUserDataDir.getUserDataDir()) => {
  const workspaceStoragePath = join(userDataDir, 'User', 'globalStorage')
  await rm(workspaceStoragePath, {
    force: true,
    recursive: true,
  })
}
