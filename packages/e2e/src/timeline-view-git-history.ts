import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
}

export const run = async (context: TestContext): Promise<void> => {
  const { ActivityBar, Git, Workspace } = context
  const { Timeline } = context as any

  await Workspace.setFiles([
    {
      content: 'first line\n',
      name: 'timeline.txt',
    },
  ])

  await Git.init()
  await Git.add()
  await Git.commit('create timeline.txt')

  await Workspace.add({
    content: 'first line\nsecond line\n',
    name: 'timeline.txt',
  })
  await Git.add()
  await Git.commit('add second line to timeline.txt')

  await Workspace.add({
    content: 'first line updated\nsecond line\nthird line\n',
    name: 'timeline.txt',
  })
  await Git.add()
  await Git.commit('update timeline.txt contents')

  await ActivityBar.showExplorer()
  await Timeline.open('timeline.txt')
  await Timeline.shouldHaveItem('update timeline.txt contents')
  await Timeline.shouldHaveItem('add second line to timeline.txt')
  await Timeline.shouldHaveItem('create timeline.txt')
}
