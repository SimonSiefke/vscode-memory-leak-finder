import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

// @ts-ignore
export const setup = async ({ Editor, Electron, Extensions, LanguageModelEditor }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  // @ts-ignore
  await Extensions.install({
    id: 'github copilot chat',
    name: 'GitHub Copilot Chat',
  })
  await Editor.closeAll()
  await LanguageModelEditor.open()
}

// @ts-ignore
export const run = async ({ LanguageModelEditor, Editor }: TestContext): Promise<void> => {
  await LanguageModelEditor.filter({
    searchValue: 'gpt',
  })
  await new Promise((r) => {})
  await LanguageModelEditor.clearFilter()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
