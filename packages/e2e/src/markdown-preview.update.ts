import type { TestContext } from '../types.js'

export const skip = true

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
  await Editor.open('index.md')
}

// @ts-ignore
export const run = async ({ QuickPick, WellKnownCommands, MarkdownPreview }: TestContext): Promise<void> => {
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  await MarkdownPreview.shouldBeVisible()
  await MarkdownPreview.shouldHaveHeading('hello-world')
  // TODO update editor and verify that markdown preview updates as well
}
