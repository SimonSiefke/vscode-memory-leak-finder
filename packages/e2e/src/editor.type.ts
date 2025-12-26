import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'sample text',
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.shouldHaveText('sample text')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.shouldHaveText('sample text')
  await Editor.type('More ')
  await Editor.shouldHaveText('More sample text')
  await Editor.deleteCharactersLeft({ count: 5 })
  await Editor.shouldHaveText('sample text')
  await Editor.save({ viaKeyBoard: true })
}
