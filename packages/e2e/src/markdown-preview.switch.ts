import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({
  Editor,
  Explorer,
  MarkdownPreview,
  QuickPick,
  // @ts-ignore
  WellKnownCommands,
  Workbench,
  Workspace,
}: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `# hello world`,
      name: 'index.md',
    },
    {
      content: `# abc`,
      name: 'other.md',
  Workbench,
  Workspace,
  Explorer,
  Editor,
  QuickPick,
  // @ts-ignore
  WellKnownCommands,
  MarkdownPreview,
}: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.md',
      content: `# hello world`,
    },
    {
      name: 'other.md',
      content: `# abc`,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.md')
  await Editor.open('index.md')
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  const subFrame = await MarkdownPreview.shouldBeVisible()
  // @ts-ignore
  await MarkdownPreview.shouldHaveHeading(subFrame, 'hello-world')
  // @ts-ignore
  await Workbench.focusLeftEditorGroup()
}

// @ts-ignore
export const run = async ({ Editor, MarkdownPreview, QuickPick, WellKnownCommands, Workbench }: TestContext): Promise<void> => {
export const run = async ({ Workbench, Editor, QuickPick, WellKnownCommands, MarkdownPreview }: TestContext): Promise<void> => {
  await Editor.open('other.md')
  const subFrame2 = await MarkdownPreview.shouldBeVisible()
  // @ts-ignore
  await MarkdownPreview.shouldHaveHeading(subFrame2, 'abc')
  await Editor.open('index.md')
  const subFrame = await MarkdownPreview.shouldBeVisible()
  // @ts-ignore
  await MarkdownPreview.shouldHaveHeading(subFrame, 'hello-world')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
