import { existsSync } from 'node:fs'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as Electron from '../Electron/Electron.ts'
import * as Exec from '../Exec/Exec.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Root from '../Root/Root.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, page, VError }) => {
  return {
    async add(file) {
      const workspace = join(Root.root, '.vscode-test-workspace')
      const absolutePath = join(workspace, file.name)
      await mkdir(dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, file.content)
    },
    async addExtension(name) {
      try {
        const electron = Electron.create({ electronApp, VError })
        const extensionsFolder = join(Root.root, '.vscode-extensions-source', name)
        await electron.mockOpenDialog({
          bookmarks: [],
          canceled: false,
          filePaths: [extensionsFolder],
        })
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.InstallExtensionFromLocation)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to add extension ${name}`)
      }
    },
    getWorkspaceFilePath(relativePath) {
      const filePath = join(Root.root, '.vscode-test-workspace', relativePath)
      return filePath
    },
    getWorkspacePath() {
      const workspace = join(Root.root, '.vscode-test-workspace')
      return workspace
    },
    async initializeGitRepository() {
      const workspace = join(Root.root, '.vscode-test-workspace')
      await Exec.exec('git', ['init'], { cwd: workspace })
      await Exec.exec('git', ['config', 'user.name', 'Test User'], { cwd: workspace })
      await Exec.exec('git', ['config', 'user.email', 'test@example.com'], { cwd: workspace })
    },
    async remove(file) {
      const workspace = join(Root.root, '.vscode-test-workspace')
      const absolutePath = join(workspace, file)
      await rm(absolutePath, { force: true, recursive: true })
    },
    async setFiles(files) {
      await page.waitForIdle()
      const workspace = join(Root.root, '.vscode-test-workspace')
      const dirents = await readdir(workspace)
      for (const dirent of dirents) {
        const absolutePath = join(workspace, dirent)
        await rm(absolutePath, { force: true, recursive: true })
      }
      for (const file of files) {
        const absolutePath = join(workspace, file.name)
        await mkdir(dirname(absolutePath), { recursive: true })
        await writeFile(absolutePath, file.content)
      }
      await page.waitForIdle()
    },
    async waitForFile(fileName) {
      const workspace = join(Root.root, '.vscode-test-workspace')
      const absolutePath = join(workspace, fileName)
      if (existsSync(absolutePath)) {
        return true
      }
      const maxWaits = 100
      const checkTime = 50
      for (let i = 0; i < maxWaits; i++) {
        if (existsSync(absolutePath)) {
          return true
        }
        const { promise, resolve } = Promise.withResolvers()
        setTimeout(resolve, checkTime)
        await promise
      }
      return false
    },
  }
}
