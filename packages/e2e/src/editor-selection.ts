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
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.setCursor(1, 2)
  // @ts-ignore
  await Editor.expandSelection()
  // @ts-ignore
  await Editor.shouldHaveSelectedCharacters(20)
  await Editor.cursorRight()
  await Editor.shouldHaveEmptySelection()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
