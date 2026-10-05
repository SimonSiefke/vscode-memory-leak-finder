import type { TestContext } from '../types.ts'

const initialSettings = {
  'editor.minimap.enabled': true,
}

const updatedSettings = {
  'editor.minimap.enabled': false,
}

const editorContent = Array.from({ length: 80 }, (_, index) => `const value${index} = ${index}`).join('\n') + '\n'

const writeSettings = async (Workspace: TestContext['Workspace'], settings: Record<string, unknown>): Promise<void> => {
  await Workspace.writeFile('.vscode/settings.json', JSON.stringify(settings, null, 2) + '\n')
}

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: editorContent,
      name: 'file.txt',
    },
    {
      content: JSON.stringify(initialSettings, null, 2) + '\n',
      name: '.vscode/settings.json',
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ Editor, Explorer, SideBar, Workspace }: TestContext): Promise<void> => {
  await SideBar.show()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('file.txt')
  await Explorer.openItem('file.txt')
  await Editor.shouldHaveMinimap()
  await writeSettings(Workspace, updatedSettings)
  await Editor.shouldNotHaveMinimap()
  await writeSettings(Workspace, initialSettings)
  await Editor.shouldHaveMinimap()
}

export const teardown = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
}
