import type { TestContext } from '../types.ts'

export const setup = async ({ Panel, ActivityBar, Editor, Explorer, Workspace, SideBar, Terminal }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Terminal.killAll()
  await Panel.hide()
  // @ts-ignore
  await SideBar.hideSecondary()
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
  await SideBar.hide()
}

export const run = async ({ Task, Terminal }: TestContext): Promise<void> => {
  await Task.runError({ taskName: 'error-task', scanType: 'Continue without scanning the task output' })
  await Terminal.killAll()
}
