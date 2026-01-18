import { mkdir, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import * as Exec from '../Exec/Exec.ts'
import * as Root from '../Root/Root.ts'

export const create = ({ page, VError }) => {
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
  }
}
