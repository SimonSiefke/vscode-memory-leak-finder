import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ Editor, Electron, Extensions, SideBar, Workspace }: TestContext): Promise<void> => {
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
      content: 'abc',
      name: 'test.ts',
    },
  ])
  await Editor.open('test.ts')
  await Editor.shouldHaveText('abc')
  await Editor.shouldHaveSquigglyError()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.showInlineChat()
  // @ts-ignore
  await Editor.hideInlineChat()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({
    viaKeyBoard: true,
  })
  await Editor.closeAll()
}
