import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ ActivityBar, Editor, Explorer, Panel, SideBar, Task, Terminal, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Terminal.killAll()
  await Panel.hide()
  await Workspace.setFiles([
    {
      content: `{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "echo",
      "type": "shell",
      "command": "echo Hello",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    }
  ]
}`,
      name: '.vscode/tasks.json',
    },
  ])
  await ActivityBar.showExplorer()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('.vscode')
  await Explorer.refresh()
  await SideBar.hide()
  await Task.openQuickPick({ item: 'echo' })
  await Task.hideQuickPick()
  await Editor.closeAll()
}

export const run = async ({ Task }: TestContext): Promise<void> => {
  await Task.run('echo')
  await Task.clear()
}
