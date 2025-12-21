import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ ActivityBar, Git, SourceControl, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1>hello world</h1>',
      name: 'index.html',
    },
  ])
  await Git.init()
  await Git.add()
  await Git.commit('first commit')
  await Workspace.add({ content: 'test', name: 'file2.txt' })
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
