import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ ActivityBar, Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1>hello world</h1>',
      name: 'index.html',
    },
  ])
  await Workspace.initializeGitRepository()
  await Editor.closeAll()
  await Explorer.focus()
  await ActivityBar.showSourceControl()
}

export const run = async ({ Git, SourceControl, Workspace }: TestContext): Promise<void> => {
  const git = Git as typeof Git & {
    openRepository(relativePath: string): Promise<void>
  }

  await SourceControl.shouldHaveRepositoryCount(1)

  await Workspace.add({
    content: '# nested repository',
    name: 'nested-repo/README.md',
  })
  await Git.initRepository('nested-repo')
  await git.openRepository('nested-repo')
  await SourceControl.shouldHaveRepositoryCount(2)

  await SourceControl.closeRepository('nested-repo')
  await Workspace.remove('nested-repo')
  await SourceControl.shouldHaveRepositoryCount(1)
}
