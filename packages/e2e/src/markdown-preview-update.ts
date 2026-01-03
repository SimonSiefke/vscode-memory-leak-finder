import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({
  Editor,
  Explorer,
  MarkdownPreview,
  QuickPick,

  WellKnownCommands,
  Workbench,
  Workspace,
}: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `# hello world`,
      name: 'index.md',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.md')
  await Editor.open('index.md')
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  const subFrame = await MarkdownPreview.shouldBeVisible()

  await MarkdownPreview.shouldHaveHeading(subFrame, 'hello-world')

  await Workbench.focusLeftEditorGroup()
}

export const run = async ({ Editor, MarkdownPreview, QuickPick, WellKnownCommands, Workbench }: TestContext): Promise<void> => {
  const subFrame = await MarkdownPreview.shouldBeVisible()

  await MarkdownPreview.shouldHaveHeading(subFrame, 'hello-world')
  await Editor.deleteAll()
  await Editor.type('a')
  await Editor.type('b')
  await Editor.type('c')
  await Editor.type(' ')
  await Editor.type('#')

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

  await MarkdownPreview.shouldHaveHeading(subFrame, 'hello-world')
  await Editor.save({ viaKeyBoard: true })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
