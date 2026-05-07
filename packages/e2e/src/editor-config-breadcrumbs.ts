import type { TestContext } from '../types.ts'

const initialSettings = {
  'breadcrumbs.enabled': true,
}

const updatedSettings = {
  'breadcrumbs.enabled': false,
}

const writeSettings = async (Workspace: TestContext['Workspace'], settings: Record<string, unknown>): Promise<void> => {
  await Workspace.writeFile('.vscode/settings.json', JSON.stringify(settings, null, 2) + '\n')
}

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'export const answer = 42\n',
      name: 'src/file.ts',
    },
    {
      content: JSON.stringify(initialSettings, null, 2) + '\n',
      name: '.vscode/settings.json',
    },
  ])
  await Editor.closeAll()
  await Editor.closeAllEditorGroups()
}

export const run = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.open('src/file.ts')
  await Editor.shouldHaveBreadCrumbs()
  await writeSettings(Workspace, updatedSettings)
  await Editor.shouldNotHaveBreadCrumbs()
  await writeSettings(Workspace, initialSettings)
  await Editor.shouldHaveBreadCrumbs()
}

export const teardown = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Editor.closeAllEditorGroups()
  await SideBar.hide()
}
