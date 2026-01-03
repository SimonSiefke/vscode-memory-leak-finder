import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1>hello world</h1>',
      name: 'index.html',
    },
  ])
  await Editor.open('index.html')
  await Editor.shouldHaveBreadCrumb('h1')
  await Editor.shouldHaveText('<h1>hello world</h1>')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.selectLine()
  // @ts-ignore
  await Editor.shouldHaveSelectedCharacters(13)
  // TODO verify status bar item with selected characters count
  // await Editor.shouldHaveSelection('8px', /(15px|17px)/)
  await Editor.cursorRight()
  await Editor.shouldHaveEmptySelection()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
