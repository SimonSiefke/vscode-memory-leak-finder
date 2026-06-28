import type { TestContext } from '../types.ts'

const initialSettings = {
  'explorer.autoReveal': false,
}

const updatedSettings = {
  'explorer.autoReveal': true,
}

const writeSettings = async (Workspace: TestContext['Workspace'], settings: Record<string, unknown>): Promise<void> => {
  await Workspace.writeFile('.vscode/settings.json', JSON.stringify(settings, null, 2) + '\n')
}

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'a\n',
      name: 'a.txt',
    },
    {
      content: 'b\n',
      name: 'b.txt',
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
  await Explorer.shouldHaveItem('a.txt')
  await Explorer.shouldHaveItem('b.txt')
  await Explorer.selectItem('a.txt')
  await Editor.open('b.txt')
  await Explorer.shouldHaveFocusedItem('a.txt')
  await writeSettings(Workspace, updatedSettings)
  await Editor.open('a.txt')
  await Editor.open('b.txt')
  await Explorer.shouldHaveFocusedItem('b.txt')
  await writeSettings(Workspace, initialSettings)
  await Editor.open('a.txt')
  await Explorer.shouldHaveFocusedItem('b.txt')
}

export const teardown = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
}
