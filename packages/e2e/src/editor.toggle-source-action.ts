import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor, Workspace, Explorer  }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.js',
      content: `import {readFile} from 'node:fs'

readFile`,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.js')
  await Editor.open('index.js')
  await Editor.closeAll()
  await Editor.open('index.js')
}

export const run = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.showSourceAction()
  await Editor.hideSourceAction()
}
