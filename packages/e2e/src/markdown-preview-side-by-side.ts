import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `# First Document`,
      name: 'first.md',
    },
    {
      content: `# Second Document`,
      name: 'second.md',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('first.md')
  await Explorer.shouldHaveItem('second.md')
}

export const run = async ({ Editor, MarkdownPreview, QuickPick, WellKnownCommands }: TestContext): Promise<void> => {
  await Editor.open('first.md')
  await Editor.splitDown()
  await Editor.focusTopEditorGroup()
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  const subFrame1 = await MarkdownPreview.shouldBeVisible()
  await MarkdownPreview.shouldHaveHeading(subFrame1, 'first-document')

  await Editor.focusBottomEditorGroup()
  await Editor.open('second.md')
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  const subFrame2 = await MarkdownPreview.shouldBeVisible()
  await MarkdownPreview.shouldHaveHeading(subFrame2, 'second-document')

  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
