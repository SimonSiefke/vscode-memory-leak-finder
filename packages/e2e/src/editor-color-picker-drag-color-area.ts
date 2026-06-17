import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace, ColorPicker }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'hello world',
      name: 'index.txt',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.txt')
  await Editor.open('index.txt')
  await Editor.shouldHaveBreadCrumb('index.txt')
  await Editor.shouldHaveText('hello world')
  await Editor.setCursor(1, 1)
  await ColorPicker.open()
}

export const run = async ({ ColorPicker }: TestContext): Promise<void> => {
  await ColorPicker.shouldChangeColorValueWhenDraggingColorAreaPointerRight()
}

export const teardown = async ({ Editor, ColorPicker }: TestContext): Promise<void> => {
  await ColorPicker.close()
  await Editor.closeAll()
}
