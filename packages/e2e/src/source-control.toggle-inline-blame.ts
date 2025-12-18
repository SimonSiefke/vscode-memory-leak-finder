import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Workspace, Git, ActivityBar, SourceControl, Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      name: 'index.html',
      content: '<h1>hello world</h1>',
    },
  ])
  await Git.init()
  await Git.add()
  await Git.commit('first commit')
  await ActivityBar.showSourceControl()
  await SourceControl.shouldHaveHistoryItem('first commit')
  await Editor.open('index.html')
  await Editor.shouldHaveText('<h1>hello world</h1>')
}

export const run = async ({ SourceControl }: TestContext): Promise<void> => {
  await SourceControl.enableInlineBlame({ expectedDecoration: /first commit/ })
  await SourceControl.disableInlineBlame()
}
