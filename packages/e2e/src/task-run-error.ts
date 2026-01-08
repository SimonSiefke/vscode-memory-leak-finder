import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Task, Panel, ActivityBar, Editor, Explorer, Workspace, SideBar, Terminal }: TestContext): Promise<void> => {
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
  await Task.runError({ taskName: 'error-task', scanType: '' })
  // @ts-ignore
  await Task.clearTerminal()
}

export const run = async ({ Task }: TestContext): Promise<void> => {
  // TODO maybe kill all terminals here
  // @ts-ignore
  await Task.reRunLast({ hasError: true })
  // @ts-ignore
  await Task.clearTerminal()
}
