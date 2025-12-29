import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '<h1>hello world</h1>',
      name: 'index.html',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.html')
  await Editor.open('index.html')
  await Editor.shouldHaveText('<h1>hello world</h1>')
  await Editor.shouldHaveCursor('0px')
  await Editor.closeFind()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.openFind()
  await Editor.closeFind()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
