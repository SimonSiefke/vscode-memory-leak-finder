import { mkdir, rm } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'

const retryDelay = 1000
const maxRemoveAttempts = 121

const removeTestWorkspace = async (testWorkspacePath: string): Promise<void> => {
  for (let attempt = 1; attempt <= maxRemoveAttempts; attempt++) {
    try {
      await rm(testWorkspacePath, { force: true, recursive: true })
      return
    } catch (error) {
      const isBusyError = (error as NodeJS.ErrnoException).code === 'EBUSY'
      if (!isBusyError || attempt === maxRemoveAttempts) {
        throw error
      }
      await setTimeout(retryDelay)
    }
  }
}

export const createTestWorkspace = async (testWorkspacePath: string): Promise<void> => {
  await removeTestWorkspace(testWorkspacePath)
  await mkdir(testWorkspacePath, { recursive: true })
}
