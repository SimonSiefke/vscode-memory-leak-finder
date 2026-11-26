import type { TestContext } from '../types.ts'

export const skip = 1

// The Graph view refreshes asynchronously after the repository state changes.
const historyTimeout = 15_000

let cycle = 0

export const setup = async ({ ActivityBar, Editor, Git, SourceControl, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'base\n',
      name: 'base.txt',
    },
  ])
  await Git.init()
  await Git.add()
  await Git.commit('base commit')
  await Workspace.add({ content: 'feature\n', name: 'feature.txt' })
  await Editor.closeAll()
  await ActivityBar.showSourceControl()
  await SourceControl.refresh()
  await SourceControl.shouldHaveHistoryItem('base commit')
  await SourceControl.shouldHaveUnstagedFile('feature.txt')
  await Git.shouldHaveCommitCount(1)
}

export const run = async ({ Git, SourceControl }: TestContext): Promise<void> => {
  cycle++
  const message = `commit from input ${cycle}`
  const baseCommit = await Git.getHeadCommit()

  await SourceControl.stageFile('feature.txt')
  await SourceControl.typeCommitMessage(message)
  await SourceControl.commitFromInput()
  await SourceControl.shouldHaveCommitMessage('')
  await SourceControl.shouldNotHaveChange('feature.txt')
  await SourceControl.shouldHaveHistoryItem(message, { timeout: historyTimeout })
  await Git.shouldHaveLastCommitMessage(message)
  await Git.shouldHaveCommitCount(2)

  await SourceControl.undoLastCommit()
  await SourceControl.shouldHaveCommitMessage(message)
  await Git.shouldHaveHeadCommit(baseCommit)
  await SourceControl.shouldNotHaveHistoryItem(message, { timeout: historyTimeout })
  await SourceControl.shouldHaveHistoryItem('base commit')

  await SourceControl.clearCommitMessage()
  await SourceControl.unstageFile('feature.txt')
  await Git.shouldHaveNoStagedDiff('feature.txt')
  await Git.shouldHaveCommitCount(1)
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
}
