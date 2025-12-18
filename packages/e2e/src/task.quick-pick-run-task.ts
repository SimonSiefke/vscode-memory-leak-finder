import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Workspace, ActivityBar, Explorer }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      name: '.vscode/tasks.json',
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
    },
  ])
  await ActivityBar.showExplorer()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('.vscode')
  await Explorer.refresh()
}

export const run = async ({ Task }: TestContext): Promise<void> => {
  // @ts-ignore
  await Task.openQuickPick({
    item: 'echo',
  })
  // @ts-ignore
  await Task.selectQuickPickItem({
    item: 'echo',
  })
  // @ts-ignore
  await Task.clear()
}
