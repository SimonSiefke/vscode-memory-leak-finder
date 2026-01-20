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
}

let i = 0

export const run = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  const current = ++i
  await Workspace.setFiles([
    {
      content: '',
      name: `${current}.ts`,
    },
  ])
  await Editor.open(`${current}.ts`)
  await Editor.type('const addNumbers')
  // @ts-ignore
  await Editor.acceptInlineSuggestion()
  await Editor.save({
    viaKeyBoard: true,
  })
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({
    viaKeyBoard: true,
  })
  await Editor.closeAll()
}
