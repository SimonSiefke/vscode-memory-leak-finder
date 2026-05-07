import type { TestContext } from '../types.ts'

const initialSettings = {
  'workbench.activityBar.visible': true,
}

const updatedSettings = {
  'workbench.activityBar.visible': false,
}

const writeSettings = async (Workspace: TestContext['Workspace'], settings: Record<string, unknown>): Promise<void> => {
  await Workspace.writeFile('.vscode/settings.json', JSON.stringify(settings, null, 2) + '\n')
}

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'activity bar visibility test\n',
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

export const run = async ({ ActivityBar, Workspace }: TestContext): Promise<void> => {
  await ActivityBar.showExplorer()
  await ActivityBar.shouldBeVisible()
  await writeSettings(Workspace, updatedSettings)
  await ActivityBar.shouldBeHidden()
  await writeSettings(Workspace, initialSettings)
  await ActivityBar.shouldBeVisible()
}

export const teardown = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Editor.closeAllEditorGroups()
  await SideBar.hide()
}
