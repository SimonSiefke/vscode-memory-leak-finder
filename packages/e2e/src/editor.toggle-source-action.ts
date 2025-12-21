<<<<<<< HEAD:packages/e2e/src/editor.toggle-source-action.js
// export const skip = true
=======
import type { TestContext } from '../types.ts'

export const skip = true
>>>>>>> origin/main:packages/e2e/src/editor.toggle-source-action.ts

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `import {readFile} from 'node:fs'

readFile`,
      name: 'index.js',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.js')
  await Editor.open('index.js')
  await Editor.closeAll()
  await Editor.open('index.js')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.showSourceAction()
  await Editor.hideSourceAction()
}
