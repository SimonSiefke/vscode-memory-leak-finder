import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ ActivityBar, Editor, Explorer, SourceControl, Workspace }: TestContext): Promise<void> => {
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
}

export const run = async ({ SourceControl }: TestContext): Promise<void> => {
  await SourceControl.hideGraph()
  await SourceControl.showGraph()
  await SourceControl.hideGraph()
  await SourceControl.showGraph()
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.saveAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
