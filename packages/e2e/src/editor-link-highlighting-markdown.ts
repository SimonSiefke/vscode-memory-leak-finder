import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `# First Document

[Open second](second.md)
`,
      name: 'first.md',
    },
    {
      content: `# Second Document

Second file content.
`,
      name: 'second.md',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('first.md')
  await Explorer.shouldHaveItem('second.md')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('first.md')
  // @ts-ignore
  await Editor.shouldHaveVisibleLink('second.md')
  // @ts-ignore
  await Editor.clickLink('second.md')
  await Editor.shouldHaveText(
    `# Second Document

Second file content.
`,
    'second.md',
  )
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
