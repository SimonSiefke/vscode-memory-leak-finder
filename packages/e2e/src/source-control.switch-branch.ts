import type { TestContext } from '../types.ts'

export const setup = async ({
  Workspace,
  Git,
  Editor,
  ActivityBar,
  SourceControl,
}: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'a.txt',
      content: 'content in main branch',
    },
    {
      name: 'b.txt',
      content: 'content in main branch',
    },
  ])
  await Git.init()
  await Git.add()
  await Git.commit('initial commit')
  await Git.createBranch('a')
  await Git.createBranch('b')
  await Git.checkoutBranch('b')
  await Workspace.setFiles([
    {
      name: 'b.txt',
      content: 'content in branch b',
    },
  ])
  await Git.add()
  await Git.commit('update b.txt in branch b')
  await Git.checkoutBranch('main')
  await ActivityBar.showSourceControl()
  await SourceControl.refresh()
  await Editor.closeAll()
  await Editor.open('b.txt')
}

export const run = async ({
  SourceControl,
  Editor,
}: TestContext): Promise<void> => {
  await Editor.shouldHaveText('content in main branch')
  await SourceControl.showBranchPicker()
  await SourceControl.selectBranch('b')
  await Editor.shouldHaveText('content in branch b')
  await SourceControl.showBranchPicker()
  await SourceControl.selectBranch('main')
  await Editor.shouldHaveText('content in main branch')
}

