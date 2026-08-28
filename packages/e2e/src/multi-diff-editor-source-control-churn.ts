import type { TestContext } from '../types.ts'

export const skip = 1

const originalFiles = [
  { content: 'alpha\n', name: 'alpha.txt' },
  { content: 'beta\n', name: 'beta.txt' },
  { content: 'gamma\n', name: 'gamma.txt' },
]

export const setup = async ({ Editor, Extensions, SourceControl, Workspace }: TestContext): Promise<void> => {
  await Extensions.add({
    expectedName: 'scm-multi-diff-opener-sample',
    path: 'packages/e2e/fixtures/sample.scm-multi-diff-opener',
  })
  await Editor.closeAll()
  await Workspace.setFilesWithoutWaiting(originalFiles)
  await Workspace.initializeGitRepository()
  await Workspace.gitAdd()
  await Workspace.gitCommit('initial files')
  for (const file of originalFiles) {
    await Workspace.add({
      content: `${file.content.trim()} changed\n`,
      name: file.name,
    })
  }
  await SourceControl.show()
  for (const file of originalFiles) {
    await SourceControl.shouldHaveUnstagedFile(file.name)
  }
}

export const run = async ({ Editor, MultiDiffEditor }: TestContext): Promise<void> => {
  try {
    await MultiDiffEditor.openSourceControlChanges()
    await MultiDiffEditor.shouldBeVisible()
    await MultiDiffEditor.shouldHaveFileCount(3)
  } finally {
    await Editor.closeAll()
  }
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
}
