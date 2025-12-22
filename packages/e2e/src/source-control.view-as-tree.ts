import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ ActivityBar, Editor, Explorer, Workspace, SourceControl }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1>hello world</h1>',
      name: 'src/index.html',
    },
  ])
  await Workspace.initializeGitRepository()
  await Editor.closeAll()
  await Explorer.focus()
  await ActivityBar.showSourceControl()
  await SourceControl.shouldHaveUnstagedFile('index.html')
  await SourceControl.stageFile('index.html', 'src')
  await SourceControl.hideGraph()
}

export const run = async ({ SourceControl }: TestContext): Promise<void> => {
  await SourceControl.viewAsTree()
  await SourceControl.viewAsList()
}
