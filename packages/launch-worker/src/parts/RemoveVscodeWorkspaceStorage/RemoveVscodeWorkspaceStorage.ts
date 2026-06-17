import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.ts'

export const removeVsCodeWorkspaceStorage = async (userDataDir = GetUserDataDir.getUserDataDir()) => {
  const workspaceStoragePath = join(userDataDir, 'User', 'workspaceStorage')
  await rm(workspaceStoragePath, {
    force: true,
    recursive: true,
  })
}
