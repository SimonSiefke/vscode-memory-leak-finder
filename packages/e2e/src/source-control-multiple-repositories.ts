import type { TestContext } from '../types.ts'

export const setup = async ({ ActivityBar, Git, QuickPick, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '# Repository A',
      name: 'a/README.md',
    },
    {
      content: '# Repository B',
      name: 'b/README.md',
    },
  ])
  await Git.initRepository('a')
  await Git.initRepository('b')
  await QuickPick.waitForCommand('Git: Open Repository')
  await Git.openRepository('a')
  await Git.openRepository('b')
  await ActivityBar.showSourceControl()
}

export const run = async ({ Git, SourceControl }: TestContext): Promise<void> => {
  await SourceControl.shouldHaveRepositoryCount(2)
  await SourceControl.shouldHaveRepository('a')
  await SourceControl.shouldHaveRepository('b')

  await SourceControl.closeRepository('a')
  await SourceControl.shouldNotHaveRepository('a')
  await SourceControl.shouldHaveRepositoryCount(1)

  await Git.reopenClosedRepository('a')
  await SourceControl.shouldHaveRepositoryCount(2)
  await SourceControl.shouldHaveRepository('a')
  await SourceControl.shouldHaveRepository('b')
}

export const teardown = async ({ Git, SourceControl, Workspace }: TestContext): Promise<void> => {
  await SourceControl.closeRepository('a')
  await Git.closeRepository()
  await SourceControl.shouldHaveRepositoryCount(0)
  await Workspace.setFiles([])
}
