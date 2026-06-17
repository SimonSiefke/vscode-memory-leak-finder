import type { TestContext } from '../types.ts'

export const skip = true

const originalContent = `alpha
line 2
line 3
line 4
line 5
line 6
line 7
line 8
line 9
line 10
omega
`

const modifiedContent = `alpha changed
line 2
line 3
line 4
line 5
line 6
line 7
line 8
line 9
line 10
omega changed
`

export const setup = async ({ Editor, SourceControl, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFilesWithoutWaiting([
    {
      content: originalContent,
      name: 'file.txt',
    },
  ])
  await Workspace.initializeGitRepository()
  // @ts-ignore
  await Workspace.gitAdd()
  // @ts-ignore
  await Workspace.gitCommit('initial commit')
  await Workspace.add({
    content: modifiedContent,
    name: 'file.txt',
  })
  await SourceControl.show()
}

export const run = async ({ DiffEditor, Git, SourceControl }: TestContext): Promise<void> => {
  await SourceControl.shouldHaveUnstagedFile('file.txt')
  await SourceControl.openChange('file.txt')
  // @ts-ignore
  await DiffEditor.stageChange('alpha changed')
  // @ts-ignore
  await Git.shouldHaveStagedDiffContaining('file.txt', '+alpha changed')
  // @ts-ignore
  await Git.shouldNotHaveStagedDiffContaining('file.txt', '+omega changed')
  // @ts-ignore
  await Git.shouldHaveWorkingTreeDiffContaining('file.txt', '+omega changed')
  // @ts-ignore
  await Git.shouldNotHaveWorkingTreeDiffContaining('file.txt', '+alpha changed')
  await SourceControl.unstageAllChanges()
  // @ts-ignore
  await Git.shouldHaveNoStagedDiff('file.txt')
  // @ts-ignore
  await Git.shouldHaveWorkingTreeDiffContaining('file.txt', '+alpha changed')
  // @ts-ignore
  await Git.shouldHaveWorkingTreeDiffContaining('file.txt', '+omega changed')
}
