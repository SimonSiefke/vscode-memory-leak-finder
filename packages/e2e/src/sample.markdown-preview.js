export const beforeSetup = async ({ Workspace, Explorer, Editor }) => {
  await Workspace.setFiles([
    {
      name: 'index.md',
      content: `# hello world`,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.waitForReady('index.md')
}

export const run = async ({ Editor, QuickPick, WellKnownCommands, WebView }) => {
  await Editor.open('index.md')
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  await WebView.shouldBeFocused()
  await Editor.closeAll()
}
