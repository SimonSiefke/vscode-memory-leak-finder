import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Workspace, Explorer, Editor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.md',
      content: `# hello world`,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.md')
}

// @ts-ignore
export const run = async ({ Editor, QuickPick, WellKnownCommands, MarkdownPreview }: TestContext): Promise<void> => {
  await Editor.open('index.md')
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  const subFrame = await MarkdownPreview.shouldBeVisible()
  // @ts-ignore
  await MarkdownPreview.shouldHaveHeading(subFrame, 'hello-world')
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
