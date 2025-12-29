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
  // @ts-ignore
  await Editor.closeAllEditorGroups()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.enable2x2GridView()
  await Editor.open('a.txt')
  // @ts-ignore
  await Editor.shouldHaveText('a', 'a.txt')
  // @ts-ignore
  await Editor.focusRightEditorGroup()
  await Editor.open('b.txt')
  // @ts-ignore
  await Editor.shouldHaveText('b', 'b.txt')
  // @ts-ignore
  await Editor.focusBottomEditorGroup()
  await Editor.open('d.txt')
  // @ts-ignore
  await Editor.shouldHaveText('d', 'd.txt')
  // @ts-ignore
  await Editor.focusLeftEditorGroup()
  await Editor.open('c.txt')
  // @ts-ignore
  await Editor.shouldHaveText('c', 'c.txt')
  // @ts-ignore
  await Editor.closeAllEditorGroups()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.closeAllEditorGroups()
}
