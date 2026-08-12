import type { TestContext } from '../types.ts'

export const setup = async ({ ActivityBar, Git, Workspace }: TestContext): Promise<void> => {
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
  await ActivityBar.showSourceControl()
}

export const run = async ({ Git, SourceControl }: TestContext): Promise<void> => {
  await SourceControl.shouldHaveRepository('a')
  await SourceControl.shouldHaveRepository('b')
  await SourceControl.shouldHaveRepositoryCount(2)

  await SourceControl.closeRepository('a')
  await SourceControl.shouldNotHaveRepository('a')
  await SourceControl.shouldHaveRepository('b')
  await SourceControl.shouldHaveRepositoryCount(1)

  await Git.openRepository('a')
  await SourceControl.shouldHaveRepository('a')
  await SourceControl.shouldHaveRepository('b')
  await SourceControl.shouldHaveRepositoryCount(2)
}
