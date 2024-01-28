import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { execa } from 'execa'
import * as Root from '../Root/Root.js'

export const create = ({ page }) => {
  return {
    async setFiles(files) {
      const workspace = join(Root.root, '.vscode-test-workspace')
      const dirents = await readdir(workspace)
      for (const dirent of dirents) {
        const absolutePath = join(workspace, dirent)
        await rm(absolutePath, { recursive: true, force: true })
      }
      for (const file of files) {
        const absolutePath = join(workspace, file.name)
        await mkdir(dirname(absolutePath), { recursive: true })
        await writeFile(absolutePath, file.content)
      }
      await page.waitForIdle()
    },
    async initializeGitRepository() {
      const workspace = join(Root.root, '.vscode-test-workspace')
      await execa('git', ['init'], { cwd: workspace })
    },
    async add(file) {
      const workspace = join(Root.root, '.vscode-test-workspace')
      const absolutePath = join(workspace, file.name)
      await mkdir(dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, file.content)
    },
    async remove(file) {
      const workspace = join(Root.root, '.vscode-test-workspace')
      const absolutePath = join(workspace, file)
      await rm(absolutePath)
    },
  }
}
