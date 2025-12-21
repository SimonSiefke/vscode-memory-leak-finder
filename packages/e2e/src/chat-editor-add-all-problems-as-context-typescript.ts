import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({
<<<<<<< HEAD
  Editor,
  ChatEditor,
  Workspace,
  Electron,
  Extensions,
  ExtensionDetailView,
  SideBar,
=======
  ChatEditor,
  Editor,
  Electron,
  ExtensionDetailView,
  Extensions,
  SideBar,
  Workspace,
>>>>>>> origin/main
}: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('github copilot chat')
  await Extensions.first.shouldBe('GitHub Copilot Chat')
  await Extensions.first.click()
  await ExtensionDetailView.installExtension()
  await SideBar.hide()
  await Editor.closeAll()
  await Workspace.setFiles([
    {
<<<<<<< HEAD
      name: 'index.ts',
      content: `let x: string = 1`,
=======
      content: `let x: string = 1`,
      name: 'index.ts',
>>>>>>> origin/main
    },
  ])
  await Editor.closeAll()
  await Editor.open('index.ts')
  await Editor.shouldHaveSquigglyError()
  await Editor.splitRight()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.addContext('Problems...', 'All Problems', 'All Problems')
  // @ts-ignore
  await ChatEditor.sendMessage(`Fix the problems please`, {
    verify: true,
  })
  // @ts-ignore
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
