import type { TestContext } from '../types.ts'

export const skip = true

const generateFileContent = () => {
  return Array(200).fill('sample text').join('\n')
}

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: generateFileContent(),
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
}

export const run = async ({ ContextMenu, Tab }: TestContext): Promise<void> => {
  await Tab.openContextMenu('file.txt')
  await ContextMenu.close()
}
