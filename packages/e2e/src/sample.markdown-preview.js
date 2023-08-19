export const beforeSetup = async ({ Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'index.md',
      content: `# hello world`,
    },
  ])
}

export const run = async ({ ActivityBar, Explorer, Editor, QuickPick, WellKnownCommands }) => {
  await Editor.open('index.md')
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  await Editor.close('Preview index.md')
  await Editor.close('index.md')
}
