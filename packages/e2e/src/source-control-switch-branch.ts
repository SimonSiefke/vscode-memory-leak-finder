import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ ActivityBar, Editor, Explorer, Git, SourceControl, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'content in main branch',
      name: 'b.txt',
    },
  ])
  await Git.init()
  await Git.add()
  await Git.commit('initial commit')
  await Git.createBranch('b')
  await Git.checkoutBranch('b')
  await Workspace.add({
    content: 'content in branch b',
    name: 'b.txt',
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

export const run = async ({ Editor, SourceControl }: TestContext): Promise<void> => {
  await Editor.shouldHaveText('content in main branch')
  await SourceControl.checkoutBranch('b')
  await Editor.close()
  await Editor.open('b.txt')
  await Editor.shouldHaveText('content in branch b')
  await SourceControl.checkoutBranch('main')
  await Editor.close()
  await Editor.open('b.txt')
  await Editor.shouldHaveText('content in main branch')
}
