import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Electron, Extensions, LanguageModelEditor }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'GitHub.copilot-chat',
    name: 'GitHub Copilot Chat',
  })
  await Editor.closeAll()
  await LanguageModelEditor.open()
}

export const run = async ({ LanguageModelEditor }: TestContext): Promise<void> => {
  await LanguageModelEditor.filter({
    searchValue: 'gpt',
  })
  await LanguageModelEditor.clearFilter()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
