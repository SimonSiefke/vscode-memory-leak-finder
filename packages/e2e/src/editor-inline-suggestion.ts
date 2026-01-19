import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ SideBar, Editor, Electron, Extensions, Workspace }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'GitHub.copilot-chat',
    name: 'GitHub Copilot Chat',
  })
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: '',
      name: 'add.ts',
    },
  ])
  await Editor.open('add.ts')
  await Editor.shouldHaveText('')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.type('const addNumbers')
  // @ts-ignore
  await Editor.acceptInlineSuggestion()
  await Editor.undo()
  await Editor.undo()
  await Editor.undo()
  await Editor.shouldHaveText('')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({
    viaKeyBoard: true,
  })
  await Editor.closeAll()
}
