import { mkdir, rm } from 'node:fs/promises'

export const createTestWorkspace = async (testWorkspacePath: string): Promise<void> => {
  await rm(testWorkspacePath, { force: true, recursive: true })
  await mkdir(testWorkspacePath, { recursive: true })
}
