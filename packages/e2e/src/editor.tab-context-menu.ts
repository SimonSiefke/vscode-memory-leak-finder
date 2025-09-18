import type { TestContext } from '../types.js'

export const skip = true

const generateFileContent = () => {
  return Array(200).fill('sample text').join('\n')
}

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: generateFileContent(),
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
}

export const run = async ({ Tab, ContextMenu }: TestContext): Promise<void> => {
  await Tab.openContextMenu('file.txt')
  await ContextMenu.close()
}
