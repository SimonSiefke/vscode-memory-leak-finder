import { mkdir, rm } from 'node:fs/promises'

export const createTestWorkspace = async (testWorkspacePath) => {
  await rm(testWorkspacePath, { recursive: true, force: true })
  await mkdir(testWorkspacePath, { recursive: true })
}
