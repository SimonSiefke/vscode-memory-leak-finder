import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ ActivityBar, Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: `{
  // See https://go.microsoft.com/fwlink/?LinkId=733558
  // for the documentation about the tasks.json format
  "version": "2.0.0",
  "tasks": [
      {
          "label": "echo",
          "type": "shell",
          "command": "echo Hello"
      }
  ]
}`,
      name: '.vscode/tasks.json',
    },
  ])
  await ActivityBar.showExplorer()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('.vscode')
}

export const run = async ({ Task }: TestContext): Promise<void> => {
  await Task.openQuickPick({
    item: 'echo, configured',
  })

  await Task.hideQuickPick()
}
