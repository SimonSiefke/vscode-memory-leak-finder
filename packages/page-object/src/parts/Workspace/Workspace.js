import { execa } from 'execa'
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as Root from '../Root/Root.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'
import * as Electron from '../Electron/Electron.js'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as Electron from '../Electron/Electron.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as Root from '../Root/Root.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ electronApp, page, expect, VError }) => {
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
    async addExtension(name) {
      const electron = Electron.create({ electronApp, VError })
      const extensionsFolder = join(Root.root, '.vscode-extensions-source', name)
      await electron.mockOpenDialog({
        response: {
          canceled: false,
          filePaths: [extensionsFolder],
          bookmarks: [],
        },
      })
      const quickPick = QuickPick.create({ page, expect, VError })
      await quickPick.executeCommand(WellKnownCommands.InstallExtensionFromLocation)
      // const destination = join(Root.root, '.vscode-test-workspace', '.vscode', 'extensions', name)
      // await mkdir(dirname(destination), {
      //   recursive: true,
      // })
      // await cp(extensionsFolder, destination, {
      //   recursive: true,
      // })
      // await page.waitForIdle()
      // TODO mock dialog
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
    getWorkspacePath() {
      const workspace = join(Root.root, '.vscode-test-workspace')
      return workspace
    },
    getWorkspaceFilePath(relativePath) {
      const filePath = join(Root.root, '.vscode-test-workspace', relativePath)
      return filePath
    },
  }
}
