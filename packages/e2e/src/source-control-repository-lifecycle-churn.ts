import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ ActivityBar, Git, QuickPick, SourceControl, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '# Lifecycle repository\n',
      name: 'repository/README.md',
    },
  ])
  await Git.initRepository('repository')
  await QuickPick.waitForCommand('Git: Open Repository')
  await Git.openRepository('repository')
  await ActivityBar.showSourceControl()
  await SourceControl.shouldHaveRepositoryCount(1)
}

export const run = async ({ Git, SourceControl }: TestContext): Promise<void> => {
  await Git.closeRepository()
  await SourceControl.shouldHaveRepositoryCount(0)

  await Git.reopenClosedRepository('repository')
  await SourceControl.shouldHaveRepositoryCount(1)
}

export const teardown = async ({ Git, SourceControl, Workspace }: TestContext): Promise<void> => {
  await Git.closeRepository()
  await SourceControl.shouldHaveRepositoryCount(0)
  await Workspace.setFiles([])
}
