import type { TestContext } from '../types.ts'

const initialSettings = {
  'workbench.sideBar.location': 'left',
}

const updatedSettings = {
  'workbench.sideBar.location': 'right',
}

const writeSettings = async (Workspace: TestContext['Workspace'], settings: Record<string, unknown>): Promise<void> => {
  await Workspace.writeFile('.vscode/settings.json', JSON.stringify(settings, null, 2) + '\n')
}

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'side bar position test\n',
      name: 'file.txt',
    },
    {
      content: JSON.stringify(initialSettings, null, 2) + '\n',
      name: '.vscode/settings.json',
    },
  ])
  await Editor.closeAll()
  await Editor.closeAllEditorGroups()
}

export const run = async ({ Explorer, SideBar, Workspace }: TestContext): Promise<void> => {
  await Explorer.focus()
  await SideBar.shouldBeVisible()
  await SideBar.shouldBeLeft()
  await writeSettings(Workspace, updatedSettings)
  await SideBar.shouldBeRight()
  await writeSettings(Workspace, initialSettings)
  await SideBar.shouldBeLeft()
}

export const teardown = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Editor.closeAllEditorGroups()
  await SideBar.hide()
}
