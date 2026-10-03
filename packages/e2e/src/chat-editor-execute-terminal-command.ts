import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, SideBar, Editor }: TestContext): Promise<void> => {
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
  })

  await Terminal.killAll()
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
