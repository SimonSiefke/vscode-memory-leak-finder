import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message: `Run echo hello world in terminal.`,
    model: 'GPT-4.1',
    toolInvocations: [
      {
        content: `echo hello world`,
        type: 'terminal',
      },
    ],
    verify: true,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
