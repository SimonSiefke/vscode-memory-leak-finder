import type { TestContext } from '../types.js'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `a
b
c`,
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.setCursor(1, 1)
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.addCursorBelow()
  // @ts-ignore
  await Editor.addCursorBelow()
  await Editor.type('1')
  await Editor.shouldHaveText(`1a
1b
1c`)
  await Editor.undo()
  await Editor.shouldHaveText(`a
b
c`)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
