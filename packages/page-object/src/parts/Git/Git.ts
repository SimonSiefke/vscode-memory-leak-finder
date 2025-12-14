import { execa } from 'execa'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const create = ({ electronApp, page, expect, VError }) => {
  return {
    async init() {
      const workspace = join(Root.root, '.vscode-test-workspace')
      await execa('git', ['init'], { cwd: workspace })
      await execa('git', ['config', 'user.name', 'Test User'], { cwd: workspace })
      await execa('git', ['config', 'user.email', 'test@example.com'], { cwd: workspace })
      await page.waitForIdle()
    },
    async add() {
      const workspace = join(Root.root, '.vscode-test-workspace')
      await execa('git', ['add', '-f', '.'], { cwd: workspace })
    },
    async commit(message) {
      const workspace = join(Root.root, '.vscode-test-workspace')
      await execa('git', ['commit', '-m', message], { cwd: workspace })
      await page.waitForIdle()
    },
    async checkoutBranch(branchName) {
      const workspace = join(Root.root, '.vscode-test-workspace')
      await execa('git', ['checkout', branchName], { cwd: workspace })
      await page.waitForIdle()
    },
    async createBranch(branchName) {
      const workspace = join(Root.root, '.vscode-test-workspace')
      await execa('git', ['checkout', '-b', branchName], { cwd: workspace })
      await page.waitForIdle()
    },
  }
}
