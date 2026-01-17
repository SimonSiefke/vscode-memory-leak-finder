import type { TestContext } from '../types.ts'

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.install({
    id: 'ms-ceintl.vscode-language-pack-fr',
    name: 'French Language Pack for Visual Studio Code',
  })
  await Editor.closeAll()
}

export const run = async ({ QuickPick, WellKnownCommands }: TestContext): Promise<void> => {
  await QuickPick.executeCommand(WellKnownCommands.ConfigureDisplayLanguage, {
    stayVisible: true,
  })
  await QuickPick.type('French')
  await QuickPick.select('Français')
  await QuickPick.executeCommand(WellKnownCommands.ConfigureDisplayLanguage, {
    stayVisible: true,
  })
  await QuickPick.type('English')
  await QuickPick.select('English')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
