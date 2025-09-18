import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.html',
      content: '<h1>hello world</h1>',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.html')
  await Editor.open('index.html')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.showSourceActionEmpty()
  await Editor.hideSourceActionEmpty()
}
