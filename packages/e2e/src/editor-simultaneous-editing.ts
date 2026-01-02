import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'initial text',
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.shouldHaveText('initial text')
  await Editor.splitRight()
  await Editor.focusLeftEditorGroup()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.shouldHaveText('initial text', 'file.txt', 1)
  // @ts-ignore
  await Editor.shouldHaveText('initial text', 'file.txt', 2)
  await Editor.type('left ')
  // @ts-ignore
  await Editor.shouldHaveText('left initial text', 'file.txt', 1)
  // @ts-ignore
  await Editor.shouldHaveText('left initial text', 'file.txt', 2)
  await Editor.focusRightEditorGroup()
  await Editor.type('right ')
  // @ts-ignore
  await Editor.shouldHaveText('right left initial text', 'file.txt', 1)
  // @ts-ignore
  await Editor.shouldHaveText('right left initial text', 'file.txt', 2)
  await Editor.undo()
  await Editor.undo()
  await Editor.saveAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
