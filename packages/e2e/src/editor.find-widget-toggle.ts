import type { TestContext } from '../types.js'

export const setup = async ({  Editor, Workspace, Explorer  }: TestContext): Promise<void> => {
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
  await Editor.shouldHaveText('<h1>hello world</h1>')
  await Editor.shouldHaveCursor('0px')
  await Editor.closeFind()
}

export const run = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.openFind()
  await Editor.closeFind()
}

export const teardown = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
