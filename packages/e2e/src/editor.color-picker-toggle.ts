import type { TestContext } from '../types.js'

export const skip = false

export const setup = async ({ Editor, Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.txt',
      content: 'hello world',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.txt')
  await Editor.open('index.txt')
  await Editor.shouldHaveText('hello world')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.showColorPicker()
  await Editor.hideColorPicker()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
