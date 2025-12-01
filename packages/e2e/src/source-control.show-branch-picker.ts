import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Workspace, Git, ActivityBar, SourceControl }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.html',
      content: '<h1>hello world</h1>',
    },
  ])
  await Git.init()
  await Git.add()
  await Git.commit('first commit')
  await Workspace.add({ name: 'file2.txt', content: 'test' })
  await Git.add()
  await Git.commit('second commit')
  await ActivityBar.showSourceControl()
  await SourceControl.shouldHaveHistoryItem('first commit')
  await SourceControl.shouldHaveHistoryItem('second commit')
}

export const run = async ({ SourceControl }: TestContext): Promise<void> => {
  await SourceControl.showBranchPicker()
  await SourceControl.hideBranchPicker()
}
