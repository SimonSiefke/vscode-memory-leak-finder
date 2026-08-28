import type { TestContext } from '../types.ts'

export const skip = 1

const markdown = `# Lifecycle Preview

This preview is opened and disposed on every cycle.

\`\`\`ts
const answer = 42
\`\`\`
`

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([{ content: markdown, name: 'lifecycle.md' }])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('lifecycle.md')
}

export const run = async ({ Editor, MarkdownPreview, QuickPick, WellKnownCommands }: TestContext): Promise<void> => {
  try {
    await Editor.open('lifecycle.md')
    await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
    const preview = await MarkdownPreview.shouldBeVisible()
    await MarkdownPreview.shouldHaveHeading(preview, 'lifecycle-preview')
    await MarkdownPreview.shouldHaveCodeBlocks(preview, 1)
    await MarkdownPreview.shouldHaveCodeBlockWithLanguage(preview, 'ts')
  } finally {
    await Editor.closeAll()
  }
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
