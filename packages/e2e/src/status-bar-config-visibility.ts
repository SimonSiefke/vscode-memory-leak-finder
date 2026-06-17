import type { TestContext } from '../types.ts'

const initialSettings = {
  'workbench.statusBar.visible': true,
}

const updatedSettings = {
  'workbench.statusBar.visible': false,
}

const writeSettings = async (Workspace: TestContext['Workspace'], settings: Record<string, unknown>): Promise<void> => {
  await Workspace.writeFile('.vscode/settings.json', JSON.stringify(settings, null, 2) + '\n')
}

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'status bar visibility test\n',
      name: 'file.txt',
    },
    {
      content: JSON.stringify(initialSettings, null, 2) + '\n',
      name: '.vscode/settings.json',
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ StatusBar, Workspace }: TestContext): Promise<void> => {
  await StatusBar.shouldBeVisible()
  await writeSettings(Workspace, updatedSettings)
  await StatusBar.shouldBeHidden()
  await writeSettings(Workspace, initialSettings)
  await StatusBar.shouldBeVisible()
}

export const teardown = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
}
