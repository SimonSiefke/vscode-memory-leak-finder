import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.ts'

export const removeVsCodeGlobalStorage = async () => {
  const workspaceStoragePath = join(GetUserDataDir.getUserDataDir(), 'User', 'globalStorage')
  await rm(workspaceStoragePath, {
    force: true,
    recursive: true,
  })
}
