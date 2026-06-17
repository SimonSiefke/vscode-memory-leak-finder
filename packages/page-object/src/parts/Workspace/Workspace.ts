import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Electron from '../Electron/Electron.ts'
import * as Exec from '../Exec/Exec.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Root from '../Root/Root.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const workspace = join(Root.root, '.vscode-test-workspace')
  return {
    getPath() {
      return workspace
    },
    async add(file: { name: string; content: string }) {
      const absolutePath = join(workspace, file.name)
      await mkdir(dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, file.content)
    },
    async addExtension(name: string) {
      try {
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
        const extensionsFolder = join(Root.root, '.vscode-extensions-source', name)
        await electron.mockOpenDialog({
          bookmarks: [],
          canceled: false,
          filePaths: [extensionsFolder],
        })
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.InstallExtensionFromLocation)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to add extension ${name}`)
      }
    },
    getWorkspaceFilePath(relativePath: string): string {
      const filePath = join(Root.root, '.vscode-test-workspace', relativePath)
      return filePath
    },
    getWorkspacePath() {
      return workspace
    },
    getWorkspaceSettingsPath() {
      return join(workspace, '.vscode', 'settings.json')
    },
    async initializeGitRepository() {
      await Exec.exec('git', ['init'], { cwd: workspace })
      await Exec.exec('git', ['config', 'user.name', 'Test User'], { cwd: workspace })
      await Exec.exec('git', ['config', 'user.email', 'test@example.com'], { cwd: workspace })
    },
    async gitAdd() {
      await Exec.exec('git', ['add', '-f', '.'], { cwd: workspace })
    },
    async gitCommit(message: string) {
      await Exec.exec('git', ['commit', '-m', message], { cwd: workspace })
    },
    async remove(file: string) {
      const absolutePath = join(workspace, file)
      await rm(absolutePath, { force: true, recursive: true })
    },
    async setFiles(files: Array<{ name: string; content: string }>) {
      await page.waitForIdle()
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
    async setFilesWithoutWaiting(files: Array<{ name: string; content: string }>) {
      const dirents = await readdir(workspace).catch(() => [])
      for (const dirent of dirents) {
        const absolutePath = join(workspace, dirent)
        await rm(absolutePath, { force: true, recursive: true })
      }
      for (const file of files) {
        const absolutePath = join(workspace, file.name)
        await mkdir(dirname(absolutePath), { recursive: true })
        await writeFile(absolutePath, file.content)
      }
    },
    async readWorkspaceSettings(): Promise<Record<string, unknown>> {
      const settingsPath = this.getWorkspaceSettingsPath()
      const content = await readFile(settingsPath, 'utf8').catch(() => '')
      if (!content) {
        return {}
      }
      return JSON.parse(content)
    },
    async updateWorkspaceSettings(settings: Record<string, unknown>): Promise<void> {
      const currentSettings = await this.readWorkspaceSettings()
      const nextSettings: Record<string, unknown> = {
        ...currentSettings,
      }
      for (const [key, value] of Object.entries(settings)) {
        if (value === undefined) {
          delete nextSettings[key]
        } else {
          nextSettings[key] = value
        }
      }
      await this.writeWorkspaceSettings(nextSettings)
    },
    async writeFile(relativePath: string, content: string): Promise<void> {
      const absolutePath = join(workspace, relativePath)
      await mkdir(dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, content)
      await page.waitForIdle()
    },
    async writeWorkspaceSettings(settings: Record<string, unknown>): Promise<void> {
      await this.writeFile('.vscode/settings.json', JSON.stringify(settings, null, 2) + '\n')
    },
    async waitForFile(fileName: string): Promise<boolean> {
      const absolutePath = join(workspace, fileName)
      if (existsSync(absolutePath)) {
        return true
      }
      const maxWaits = 600 // Increased from 100 to 600 (30 seconds)
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
