import { execa } from 'execa'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const create = ({ electronApp, page, expect, VError }) => {
  const workspace = join(Root.root, '.vscode-test-workspace')
  return {
    async init() {
      await execa('git', ['init'], { cwd: workspace })
      await execa('git', ['config', 'user.name', 'Test User'], { cwd: workspace })
      await execa('git', ['config', 'user.email', 'test@example.com'], { cwd: workspace })
      await page.waitForIdle()
    },
    async add() {
      await execa('git', ['add', '-f', '.'], { cwd: workspace })
      await page.waitForIdle()
    },
    async commit(message) {
      await execa('git', ['commit', '-m', message], { cwd: workspace })
      await page.waitForIdle()
    },
    async checkoutBranch(branchName) {
      await execa('git', ['checkout', branchName], { cwd: workspace })
      await page.waitForIdle()
    },
    async createBranch(branchName) {
      await execa('git', ['checkout', '-b', branchName], { cwd: workspace })
      await page.waitForIdle()
    },
  }
}
