import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1><spa</h1>',
      name: 'index.html',
    },
  ])
  await Editor.closeAll()
  await Editor.open('index.html')
  await Editor.shouldHaveText('<h1><spa</h1>')
  await Editor.setCursor(1, 9)
}

export const run = async ({ Suggest }: TestContext): Promise<void> => {
  await Suggest.open('span, Property')
  await Suggest.close()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
