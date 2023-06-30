import { mkdir, writeFile } from 'fs/promises'
import { join } from '../Path/Path.js'

export const createTestWorkspace = async (testWorkspacePath) => {
  await mkdir(testWorkspacePath, { recursive: true })
  await writeFile(join(testWorkspacePath, 'index.html'), '')
  await writeFile(join(testWorkspacePath, 'file.txt'), 'sample text')
}
