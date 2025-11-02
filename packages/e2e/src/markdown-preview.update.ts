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
  // @ts-ignore
  await MarkdownPreview.shouldHaveHeading(subFrame, 'hello-world')
  // @ts-ignore
  await Workbench.focusLeftEditorGroup()
  await Editor.deleteAll()
  await Editor.type('a')
  await Editor.type('b')
  await Editor.type('c')
  await Editor.type(' ')
  await Editor.type('#')
  // @ts-ignore
  await MarkdownPreview.shouldHaveHeading(subFrame, 'cba') // TODO why is it reverse?
  await Editor.deleteAll()
  await Editor.type('d')
  await Editor.type('l')
  await Editor.type('r')
  await Editor.type('o')
  await Editor.type('w')
  await Editor.type('-')
  await Editor.type('o')
  await Editor.type('l')
  await Editor.type('l')
  await Editor.type('e')
  await Editor.type('h')
  await Editor.type(' ')
  await Editor.type('#')
  // @ts-ignore
  await MarkdownPreview.shouldHaveHeading(subFrame, 'hello-world')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
