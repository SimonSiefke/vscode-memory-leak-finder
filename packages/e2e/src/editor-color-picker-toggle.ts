import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'hello world',
      name: 'index.txt',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.txt')
  await Editor.open('index.txt')
  await Editor.shouldHaveBreadCrumb('index.txt')
  await Editor.shouldHaveText('hello world')
  // @ts-ignore
  await Editor.setCursor(1, 1)
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.showColorPicker()
  await Editor.hideColorPicker()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
