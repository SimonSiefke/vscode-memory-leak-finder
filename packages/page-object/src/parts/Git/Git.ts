import { execa } from 'execa'
import { join, dirname } from 'node:path'
import { mkdir } from 'node:fs/promises'
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
      await page.waitForIdle()
    },
  }
}
