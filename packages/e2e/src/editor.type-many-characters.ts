import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  for (let i = 0; i < 100; i++) {
    await Editor.type('a')
  }
  await Editor.deleteAll()
  await Editor.save({ viaKeyBoard: true })
}
