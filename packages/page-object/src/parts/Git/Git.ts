import { execa } from 'execa'
import { join, dirname } from 'node:path'
<<<<<<< HEAD
import { mkdir } from 'node:fs/promises'
=======
import { mkdir, readdir, rm } from 'node:fs/promises'
>>>>>>> origin/main
import * as Root from '../Root/Root.ts'

export const create = ({ electronApp, page, expect, VError }) => {
  const workspace = join(Root.root, '.vscode-test-workspace')
  const workspaceParent = dirname(workspace)
  const gitEnv = {
    GIT_CEILING_DIRECTORIES: workspaceParent,
  }
  return {
    async init() {
      await mkdir(workspace, { recursive: true })
      await execa('git', ['init'], { cwd: workspace, env: { ...process.env, ...gitEnv } })
      await execa('git', ['config', 'user.name', 'Test User'], { cwd: workspace, env: { ...process.env, ...gitEnv } })
      await execa('git', ['config', 'user.email', 'test@example.com'], { cwd: workspace, env: { ...process.env, ...gitEnv } })
      await page.waitForIdle()
    },
    async add() {
      await execa('git', ['add', '-f', '.'], { cwd: workspace, env: { ...process.env, ...gitEnv } })
      await page.waitForIdle()
    },
    async commit(message) {
      await execa('git', ['commit', '-m', message], { cwd: workspace, env: { ...process.env, ...gitEnv } })
      await page.waitForIdle()
    },
    async checkoutBranch(branchName) {
      await execa('git', ['checkout', branchName], { cwd: workspace, env: { ...process.env, ...gitEnv } })
      await page.waitForIdle()
    },
    async createBranch(branchName) {
      await execa('git', ['checkout', '-b', branchName], { cwd: workspace, env: { ...process.env, ...gitEnv } })
<<<<<<< HEAD
=======
      await page.waitForIdle()
    },
    async cloneRepository(repoUrl: string) {
      // Clear the workspace first
      const dirents = await readdir(workspace).catch(() => [])
      for (const dirent of dirents) {
        const absolutePath = join(workspace, dirent)
        await rm(absolutePath, { recursive: true, force: true })
      }
      // Clone directly into the workspace directory
      await execa('git', ['clone', repoUrl, '.'], { cwd: workspace, env: { ...process.env, ...gitEnv } })
>>>>>>> origin/main
      await page.waitForIdle()
    },
  }
}
