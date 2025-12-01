import type { TestContext } from '../types.ts'

export const skip = true

const generateFileContent = () => {
  return Array(200).fill('sample text').join('\n')
}

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: generateFileContent(),
    },
  ])
  await Editor.open('file.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.moveScrollBar(20, 20)
  await Editor.moveScrollBar(-20, 0)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
