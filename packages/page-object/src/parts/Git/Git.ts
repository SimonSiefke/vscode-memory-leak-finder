import { execa } from 'execa'
import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import * as Root from '../Root/Root.ts'

export const create = ({ electronApp, page, expect, VError }) => {
  const workspace = join(Root.root, '.vscode-test-workspace')
  const gitDir = join(workspace, '.git')
  const gitArgs = (args) => ['--git-dir', gitDir, '--work-tree', workspace, ...args]
  return {
    async init() {
      await mkdir(workspace, { recursive: true })
      await execa('git', ['init'], { cwd: workspace })
      await execa('git', ['config', 'user.name', 'Test User'], { cwd: workspace })
      await execa('git', ['config', 'user.email', 'test@example.com'], { cwd: workspace })
      await page.waitForIdle()
    },
    async add() {
      await execa('git', gitArgs(['add', '-f', '.']), { cwd: workspace })
      await page.waitForIdle()
    },
    async commit(message) {
      await execa('git', gitArgs(['commit', '-m', message]), { cwd: workspace })
      await page.waitForIdle()
    },
    async checkoutBranch(branchName) {
      await execa('git', gitArgs(['checkout', branchName]), { cwd: workspace })
      await page.waitForIdle()
    },
    async createBranch(branchName) {
      await execa('git', gitArgs(['checkout', '-b', branchName]), { cwd: workspace })
      await page.waitForIdle()
    },
  }
}
