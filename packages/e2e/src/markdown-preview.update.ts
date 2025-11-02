import type { TestContext } from '../types.ts'

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
export const run = async ({ Workbench, Editor, QuickPick, WellKnownCommands, MarkdownPreview }: TestContext): Promise<void> => {
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  const subFrame = await MarkdownPreview.shouldBeVisible()
  await MarkdownPreview.shouldHaveHeading(subFrame, 'hello-world')
  await Workbench.focusLeftEditorGroup()
  await Editor.deleteAll()
  await Editor.type('a')
  await Editor.type('b')
  await Editor.type('c')
  await Editor.type('#')
  await MarkdownPreview.shouldHaveHeading(subFrame, 'cba') // TODO why is it reverse?
}
