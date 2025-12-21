import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({
  Editor,
  Electron,
  ExtensionDetailView,
  Extensions,
  Panel,
  SettingsEditor,
  SideBar,
  Terminal,
  Workspace,
}: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('github copilot chat')
  await Extensions.first.shouldBe('GitHub Copilot Chat')
  await Extensions.first.click()
  await ExtensionDetailView.installExtension()
  await SideBar.hide()
  await Editor.closeAll()
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.hide()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 5,
    value: 'terminal.integrated.shellIntegration.enabled',
  })
  await SettingsEditor.enableCheckBox({
    name: 'terminal.integrated.shellIntegration.enabled',
  })
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Panel.hide()
  // @ts-ignore
  await Terminal.show({
    waitForReady: true,
  })
}

// @ts-ignore
export const run = async ({ Terminal, TerminalInlineChat, Workspace }: TestContext): Promise<void> => {
  await TerminalInlineChat.show()
  await TerminalInlineChat.sendMessage({
    message: 'test',
    verify: true,
  })
  await TerminalInlineChat.hide()
}

export const teardown = async ({ Editor, SettingsEditor, Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 5,
    value: 'terminal.integrated.shellIntegration.enabled',
  })
  await SettingsEditor.disableCheckBox({
    name: 'terminal.integrated.shellIntegration.enabled',
  })
  await Editor.closeAll()
}
