export const skip = true

export const setup = async ({ Editor, Workspace, Explorer, ActivityBar }) => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await Explorer.focus()
  await ActivityBar.showSourceControl()
}

export const run = async ({ SourceControl }) => {
  await SourceControl.shouldHaveUnstagedFile('index.html')
  await SourceControl.stageFile('index.html')
  await SourceControl.unstageFile('index.html')
}
