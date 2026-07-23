import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, SideBar, Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message: `Run echo hello world in terminal.`,
    model: ChatEditor.Models.Auto,
    approveToolCalls: true,
    // @ts-ignore
    compactToolInvocations: true,
    toolInvocations: [
      {
        content: `echo hello world`,
        type: 'terminal',
      },
    ],
    verify: true,
  })

  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
