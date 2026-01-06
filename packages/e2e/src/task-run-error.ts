import type { TestContext } from '../types.ts'

export const setup = async ({ ActivityBar, Editor, Explorer, Workspace, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Workspace.setFiles([
    {
      content: `{
  // See https://go.microsoft.com/fwlink/?LinkId=733558
  // for the documentation about the tasks.json format
  "version": "2.0.0",
  "tasks": [
      {
          "label": "error-task",
          "type": "shell",
          "command": "exit 1"
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
  await Task.runError({ taskName: 'error-task' })
}
