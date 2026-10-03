import type { TestContext } from '../types.ts'

const fileName = 'file-with-content.txt'

export const skip = 1

export const requiresNetwork = 1

const getFileContent = (): string => {
  return Array.from(
    { length: 100 },
    (_, index) => `Line ${String(index + 1).padStart(3, '0')} - sample text for IPC readFileStream capture`,
  ).join('\n')
}

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: getFileContent(),
      name: fileName,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem(fileName)
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open(fileName)
  await Editor.shouldHaveBreadCrumb(fileName)
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
