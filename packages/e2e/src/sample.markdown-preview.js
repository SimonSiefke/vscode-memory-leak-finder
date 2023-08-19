export const beforeSetup = async ({ Workspace, Explorer, Editor }) => {
  await Editor.closeAll()
  await Explorer.focus()
  await Workspace.setFiles([
    {
      name: 'index.md',
      content: `# hello world`,
    },
  ])
  await Explorer.waitForReady('index.md')
}

export const run = async ({ Editor, QuickPick, WellKnownCommands }) => {
  await Editor.open('index.md')
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  await Editor.closeAll()
}
