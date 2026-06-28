import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `before\u{200B}after
`,
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('file.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('file.txt')
  await Editor.shouldHaveControlCharacterHighlight()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
