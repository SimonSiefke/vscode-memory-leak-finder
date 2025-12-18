import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.html',
      content: '<h1>hello world</h1>',
    },
  ])
  await Editor.open('index.html')
  await Editor.shouldHaveBreadCrumb('h1')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // TODO triple click to select line
  await Editor.select('h1')
  await Editor.shouldHaveSelection('8px', /(15px|17px)/)
  await Editor.cursorRight()
  await Editor.shouldHaveEmptySelection()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
