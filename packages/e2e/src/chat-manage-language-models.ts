import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

// @ts-ignore
export const setup = async ({ Editor, Electron, Extensions, LanguageModelEditor }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'github copilot chat',
    name: 'GitHub Copilot Chat',
  })
  await Editor.closeAll()
}

// @ts-ignore
export const run = async ({ Editor, LanguageModelEditor }: TestContext): Promise<void> => {
  await LanguageModelEditor.open()
  await Editor.closeAll()
  // TODO open and close language model editor
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
