import { mkdir, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Electron from '../Electron/Electron.ts'
import * as Exec from '../Exec/Exec.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Root from '../Root/Root.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const workspace = join(Root.root, '.vscode-test-workspace')

  return {
    async add() {
      try {
        await page.waitForIdle()
        await Exec.exec('git', ['add', '-f', '.'], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to add`)
      }
    },
    async checkoutBranch(branchName: string) {
      try {
        await page.waitForIdle()
        await Exec.exec('git', ['checkout', branchName], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to checkout branch ${branchName}`)
      }
    },
    async cloneRepository(repoUrl: string) {
      // Clear the workspace first
      const dirents = await readdir(workspace).catch(() => [])
      for (const dirent of dirents) {
        const absolutePath = join(workspace, dirent)
        await rm(absolutePath, { force: true, recursive: true })
      }
      // Clone directly into the workspace directory
      await Exec.exec('git', ['clone', repoUrl, '.'], { cwd: workspace, env: { ...process.env } })
      await page.waitForIdle()
    },
    async commit(message: string) {
      try {
        await page.waitForIdle()
        await Exec.exec('git', ['commit', '-m', message], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to commit`)
      }
    },
    async createBranch(branchName: string) {
      try {
        await page.waitForIdle()
        await Exec.exec('git', ['checkout', '-b', branchName], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create branch ${branchName}`)
      }
    },
    async init() {
      try {
        await mkdir(workspace, { recursive: true })
        await Exec.exec('git', ['init', '-b', 'main'], { cwd: workspace, env: { ...process.env } })
        await Exec.exec('git', ['config', 'user.name', 'Test User'], { cwd: workspace, env: { ...process.env } })
        await Exec.exec('git', ['config', 'user.email', 'test@example.com'], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to init`)
      }
    },
    async initRepository(relativePath: string) {
      try {
        const repositoryPath = join(workspace, relativePath)
        await mkdir(repositoryPath, { recursive: true })
        await Exec.exec('git', ['init', '-b', 'main'], { cwd: repositoryPath, env: { ...process.env } })
        await Exec.exec('git', ['config', 'user.name', 'Test User'], { cwd: repositoryPath, env: { ...process.env } })
        await Exec.exec('git', ['config', 'user.email', 'test@example.com'], { cwd: repositoryPath, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to init repository at ${relativePath}`)
      }
    },
    async openRepository(relativePath: string) {
      try {
        const repositoryPath = join(workspace, relativePath)
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
        await electron.mockOpenDialog({
          bookmarks: [],
          canceled: false,
          filePaths: [repositoryPath],
        })
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.GitOpenRepository)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open repository at ${relativePath}`)
      }
    },
    async shouldHaveNoStagedDiff(fileName: string) {
      try {
        const result = await Exec.exec('git', ['diff', '--cached', '--', fileName], { cwd: workspace, env: { ...process.env } })
        if (result.stdout !== '') {
          throw new Error(`expected no staged diff for ${fileName} but got ${result.stdout}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to check staged diff for ${fileName}`)
      }
    },
    async shouldHaveStagedDiffContaining(fileName: string, text: string) {
      try {
        const result = await Exec.exec('git', ['diff', '--cached', '--', fileName], { cwd: workspace, env: { ...process.env } })
        if (!result.stdout.includes(text)) {
          throw new Error(`expected staged diff for ${fileName} to include ${text} but got ${result.stdout}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to check staged diff contents for ${fileName}`)
      }
    },
    async shouldHaveWorkingTreeDiffContaining(fileName: string, text: string) {
      try {
        const result = await Exec.exec('git', ['diff', '--', fileName], { cwd: workspace, env: { ...process.env } })
        if (!result.stdout.includes(text)) {
          throw new Error(`expected working tree diff for ${fileName} to include ${text} but got ${result.stdout}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to check working tree diff contents for ${fileName}`)
      }
    },
    async shouldNotHaveStagedDiffContaining(fileName: string, text: string) {
      try {
        const result = await Exec.exec('git', ['diff', '--cached', '--', fileName], { cwd: workspace, env: { ...process.env } })
        if (result.stdout.includes(text)) {
          throw new Error(`expected staged diff for ${fileName} not to include ${text} but got ${result.stdout}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to check staged diff contents for ${fileName}`)
      }
    },
    async shouldNotHaveWorkingTreeDiffContaining(fileName: string, text: string) {
      try {
        const result = await Exec.exec('git', ['diff', '--', fileName], { cwd: workspace, env: { ...process.env } })
        if (result.stdout.includes(text)) {
          throw new Error(`expected working tree diff for ${fileName} not to include ${text} but got ${result.stdout}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to check working tree diff contents for ${fileName}`)
      }
    },
  }
}
