import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ ActivityBar, Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1>hello world</h1>',
      name: 'index.html',
    },
  ])
  await Workspace.initializeGitRepository() //
  await Editor.closeAll()
  await Explorer.focus()
  await ActivityBar.showSourceControl()
}

export const run = async ({ SourceControl }: TestContext): Promise<void> => {
  await SourceControl.shouldHaveUnstagedFile('index.html')
  await SourceControl.stageFile('index.html')
  await SourceControl.unstageFile('index.html')
}
