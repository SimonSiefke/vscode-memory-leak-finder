import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'a',
      name: 'a.txt',
    },
    {
      content: 'b',
      name: 'b.txt',
    },
    {
      content: 'c',
      name: 'c.txt',
    },
    {
      content: 'd',
      name: 'd.txt',
    },
  ])

  await Editor.closeAllEditorGroups()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.enable2x2GridView()
  await Editor.open('a.txt')

  await Editor.shouldHaveText('a', 'a.txt')

  await Editor.focusRightEditorGroup()
  await Editor.open('b.txt')

  await Editor.shouldHaveText('b', 'b.txt')

  await Editor.focusBottomEditorGroup()
  await Editor.open('d.txt')

  await Editor.shouldHaveText('d', 'd.txt')

  await Editor.focusLeftEditorGroup()
  await Editor.open('c.txt')

  await Editor.shouldHaveText('c', 'c.txt')

  await Editor.closeAllEditorGroups()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAllEditorGroups()
}
