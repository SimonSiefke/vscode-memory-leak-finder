import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor, Workspace  }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.html',
      content: '<h1>hello world</h1>',
    },
  ])
  await Editor.open('index.html')
  await Editor.shouldHaveText('<h1>hello world</h1>')
}

export const run = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.shouldHaveText('<h1>hello world</h1>')
  await Editor.duplicateSelection()
  await Editor.shouldHaveText('<h1>hello world</h1>\n<h1>hello world</h1>')
  await Editor.undo()
}

export const teardown = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.save()
  await Editor.closeAll()
}
