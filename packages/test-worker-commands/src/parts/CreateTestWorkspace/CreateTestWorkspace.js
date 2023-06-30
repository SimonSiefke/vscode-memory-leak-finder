import { mkdir, writeFile } from 'fs/promises'
import { join } from '../Path/Path.js'

export const createTestWorkspace = async (testWorkspacePath) => {
  await mkdir(testWorkspacePath, { recursive: true })
  await writeFile(join(testWorkspacePath, 'index.html'), '<h1>hello world</h1>')
  await writeFile(join(testWorkspacePath, 'file.txt'), 'sample text')
}
