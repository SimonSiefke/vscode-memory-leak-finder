import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, SideBar }: TestContext): Promise<void> => {
  // await Electron.mockDialog({
  //   response: 1,
  // })
  // await Extensions.install({
  //   id: 'GitHub.copilot-chat',
  //   name: 'GitHub Copilot Chat',
  // })

  await SideBar.hide()
  await ChatEditor.clearAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message: `Run echo hello world in terminal.`,
    verify: true,
    toolInvocations: [
      {
        type: 'terminal',
        content: `echo hello world`,
      },
    ],
    model: 'Xiaomi: MiMo-V2-Flash (free)',
  })
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
