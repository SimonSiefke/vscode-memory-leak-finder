import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor, Workspace, Explorer, ActivityBar  }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.html',
      content: '<h1>hello world</h1>',
    },
  ])
  await Workspace.initializeGitRepository()
  await Editor.closeAll()
  await Explorer.focus()
  await ActivityBar.showSourceControl()
}

export const run = async ({  SourceControl  }: TestContext): Promise<void> => {
  await SourceControl.shouldHaveUnstagedFile('index.html')
  await SourceControl.stageFile('index.html')
  await SourceControl.unstageFile('index.html')
}
