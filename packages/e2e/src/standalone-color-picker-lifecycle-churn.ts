import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'hello world',
      name: 'index.txt',
    },
  ])
  await Editor.closeAll()
  await Editor.open('index.txt')
  await Editor.shouldHaveText('hello world')
  await Editor.setCursor(1, 1)
}

export const run = async ({ ColorPicker }: TestContext): Promise<void> => {
  await ColorPicker.open()
  await ColorPicker.shouldChangeColorValueWhenDraggingColorAreaPointerRight()
  await ColorPicker.close()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
