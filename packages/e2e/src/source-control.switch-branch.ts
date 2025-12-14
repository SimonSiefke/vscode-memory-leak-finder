import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Git, Editor, ActivityBar, SourceControl, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'b.txt',
      content: 'content in main branch',
    },
  ])
  await Git.init()
  await Git.add()
  await Git.commit('initial commit')
  await Git.createBranch('b')
  await Git.checkoutBranch('b')
  await Workspace.add({
    name: 'b.txt',
    content: 'content in branch b',
  })
  await Git.add()
  await Git.commit('update b.txt in branch b')
  await Git.checkoutBranch('main')
  await ActivityBar.showSourceControl()
  await SourceControl.shouldHaveHistoryItem('initial commit')
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('b.txt')
  await Editor.open('b.txt')
}

export const run = async ({ SourceControl, Editor, ActivityBar }: TestContext): Promise<void> => {
  await Editor.shouldHaveText('content in main branch')
  await ActivityBar.showSourceControl()
  await SourceControl.showBranchPicker()
  await SourceControl.selectBranch('b')
  await new Promise((r) => {})
  await Editor.close()
  await Editor.open('b.txt')
  await Editor.shouldHaveText('content in branch b')
  await ActivityBar.showSourceControl()
  await SourceControl.showBranchPicker()
  await SourceControl.selectBranch('main')
  await Editor.close()
  await Editor.open('b.txt')
  await Editor.shouldHaveText('content in main branch')
}
