import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ SideBar, Editor, Electron, Extensions, SettingsEditor, Workspace }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'GitHub.copilot-chat',
    name: 'GitHub Copilot Chat',
  })
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 1,
    value: 'github.copilot.chat.advanced.inlineChat2',
  })
  await SettingsEditor.enableCheckBox({
    name: 'github.copilot.chat.advanced.inlineChat2',
  })
  await Editor.closeAll()

  const notebook = {
    cells: [
      {
        cell_type: 'code',
        metadata: {},
        source: ['print("Hello, World!")'],
      },
    ],
    metadata: {
      language_info: {
        name: 'python',
      },
    },
    nbformat: 4,
    nbformat_minor: 2,
  }

  await Workspace.setFiles([
    {
      content: JSON.stringify(notebook, null, 2) + '\n',
      name: 'test.ipynb',
    },
  ])
  await Editor.open('test.ipynb')
}

export const run = async ({ NotebookInlineChat }: TestContext): Promise<void> => {
  await NotebookInlineChat.show()
  await NotebookInlineChat.hide()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
