import type { TestContext } from '../types.js'

export const skip = false

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Editor, Electron, SideBar, Terminal }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Terminal.killAll()
  await Editor.closeAll()
  await SideBar.hide()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor, Terminal }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message: `Run echo hello world in terminal.`,
    model: 'GPT-4.1',
    verify: true,
    waitForCompletion: false,
  })

  await Terminal.show()
  await Terminal.shouldContainText('hello world', 90_000)
  await Terminal.shouldHaveSuccessDecoration()
}

export const teardown = async ({ Editor, Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
}
