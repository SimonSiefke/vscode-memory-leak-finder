import type { TestContext } from '../types.ts'

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

export const run = async ({ Editor, Hover }: TestContext): Promise<void> => {
  await Editor.hover('h1', /The h1 element represents a section heading/)
  await Hover.hide()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
