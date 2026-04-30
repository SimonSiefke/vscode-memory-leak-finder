import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `apple
banana
cherry`,
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
  await Editor.type('prefix ')
  await Editor.shouldHaveText(`prefix apple
prefix banana
prefix cherry`)
  await Editor.save({ viaKeyBoard: false })
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.shouldHaveText(`prefix apple
prefix banana
prefix cherry`)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
