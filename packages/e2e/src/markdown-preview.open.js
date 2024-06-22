export const skip = true

export const setup = async ({ Workspace, Explorer, Editor }) => {
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

export const run = async ({ Editor, QuickPick, WellKnownCommands, MarkdownPreview }) => {
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  await MarkdownPreview.shouldBeVisible()
  // await MarkdownPreview.shouldHaveHeading('hello-world')
  // await Editor.close('Preview index.md')
}
