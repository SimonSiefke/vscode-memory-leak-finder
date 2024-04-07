export const skip = true

export const setup = async ({ Editor, Workspace, Explorer }) => {
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

export const run = async ({ Editor }) => {
  await Editor.showSourceAction()
  await Editor.hideSourceAction()
}
