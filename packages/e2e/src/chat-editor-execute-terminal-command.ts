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
  await ChatEditor.clearAll()
}

export const run = async ({ ChatEditor, Terminal }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message: `Use the terminal tool to run exactly: echo hello world`,
    model: ChatEditor.Models.Auto,
    approveToolCalls: true,
    verify: true,
    waitForCompletion: false,
  })

  await Terminal.show()
  await Terminal.shouldContainText('hello world', 90_000)
  await Terminal.shouldHaveSuccessDecoration()
  await Terminal.killAll()
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor, Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
}
