import type { TestContext } from '../types.js'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    { content: 'a', name: 'a.txt' },
    { content: 'b', name: 'b.txt' },
    { content: 'c', name: 'c.txt' },
    { content: 'd', name: 'd.txt' },
    { content: 'e', name: 'e.txt' },
  ])
  await Editor.closeAllEditorGroups()
  await Editor.shouldHaveEditorGroupCount(1)
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.enable2x2GridView()
  await Editor.shouldHaveEditorGroupCount(4)

  await Editor.open('a.txt')
  await Editor.focusRightEditorGroup()
  await Editor.open('b.txt')
  await Editor.focusBottomEditorGroup()
  await Editor.open('d.txt')
  await Editor.focusLeftEditorGroup()
  await Editor.open('c.txt')

  await Editor.focusTopEditorGroup()
  await Editor.newEditorGroupRight()
  await Editor.open('e.txt')
  await Editor.shouldHaveEditorGroupCount(5)
  await Editor.shouldHaveText('e', 'e.txt')

  await Editor.closeActiveEditorGroup()
  await Editor.shouldHaveEditorGroupCount(4)

  await Editor.focusTopEditorGroup()
  await Editor.shouldHaveText('a', 'a.txt')
  await Editor.focusRightEditorGroup()
  await Editor.shouldHaveText('b', 'b.txt')
  await Editor.focusBottomEditorGroup()
  await Editor.shouldHaveText('d', 'd.txt')
  await Editor.focusLeftEditorGroup()
  await Editor.shouldHaveText('c', 'c.txt')

  await Editor.enableSingleColumnLayout()
  await Editor.shouldHaveEditorGroupCount(1)
  await Editor.closeAllEditorGroups()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAllEditorGroups()
}
