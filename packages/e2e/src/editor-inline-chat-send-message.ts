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
      content: 'add',
      name: 'add.ts',
    },
  ])
  await Editor.open('add.ts')
  await Editor.shouldHaveText('add')
  await Editor.shouldHaveSquigglyError()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.showInlineChat()
  // @ts-ignore
  await Editor.sendInlineChatMessage(
    'add a function here that adds two numbers. use arrow function and const for the function declaration.',
  )
  await Editor.shouldHaveText('const abc = (a: number, b: number): number => a + b;')
  // @ts-ignore
  await Editor.hideInlineChat()
  await Editor.undo()
  await Editor.shouldHaveText('add')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({
    viaKeyBoard: true,
  })
  await Editor.closeAll()
}
