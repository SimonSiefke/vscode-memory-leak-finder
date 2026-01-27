import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Editor, Electron }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message: 'What are some facts about Benjamin Franklin',
    model: 'zAiGLM4.5 air free',
    verify: true,

    // TODO should pass in some parameters to verify it calls the wikipedia website
  })

  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
