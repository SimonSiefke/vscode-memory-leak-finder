import { execa } from 'execa'
<<<<<<< HEAD
import { readdir, rm } from 'node:fs/promises'
=======
import { mkdir, readdir, rm } from 'node:fs/promises'
>>>>>>> origin/main
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const create = ({ page, VError }) => {
  const workspace = join(Root.root, '.vscode-test-workspace')

  return {
<<<<<<< HEAD
=======
    async init() {
      try {
        await execa('git', ['init'], { cwd: workspace, env: { ...process.env } })
        await execa('git', ['config', 'user.name', 'Test User'], { cwd: workspace, env: { ...process.env } })
        await execa('git', ['config', 'user.email', 'test@example.com'], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
        await mkdir(workspace, { recursive: true })
        await execa('git', ['init'], { cwd: workspace, env: { ...process.env } })
        await execa('git', ['config', 'user.name', 'Test User'], { cwd: workspace, env: { ...process.env } })
        await execa('git', ['config', 'user.email', 'test@example.com'], { cwd: workspace, env: { ...process.env } })
      } catch (error) {
        throw new VError(error, `Failed to init`)
      }
    },
>>>>>>> origin/main
    async add() {
      try {
        await page.waitForIdle()
        await execa('git', ['add', '-f', '.'], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to add`)
      }
    },
<<<<<<< HEAD
=======
    async commit(message: string) {
      try {
        await page.waitForIdle()
        await execa('git', ['commit', '-m', message], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to commit`)
      }
    },
>>>>>>> origin/main
    async checkoutBranch(branchName: string) {
      try {
        await page.waitForIdle()
        await execa('git', ['checkout', branchName], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to checkout branch ${branchName}`)
      }
<<<<<<< HEAD
=======
    },
    async createBranch(branchName: string) {
      try {
        await page.waitForIdle()
        await execa('git', ['checkout', '-b', branchName], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create branch ${branchName}`)
      }
>>>>>>> origin/main
    },
    async cloneRepository(repoUrl: string) {
      // Clear the workspace first
      const dirents = await readdir(workspace).catch(() => [])
      for (const dirent of dirents) {
        const absolutePath = join(workspace, dirent)
        await rm(absolutePath, { force: true, recursive: true })
      }
      // Clone directly into the workspace directory
      await execa('git', ['clone', repoUrl, '.'], { cwd: workspace, env: { ...process.env } })
      await page.waitForIdle()
    },
    async commit(message: string) {
      try {
        await page.waitForIdle()
        await execa('git', ['commit', '-m', message], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to commit`)
      }
    },
    async createBranch(branchName: string) {
      try {
        await page.waitForIdle()
        await execa('git', ['checkout', '-b', branchName], { cwd: workspace, env: { ...process.env } })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create branch ${branchName}`)
      }
    },
  }
}
