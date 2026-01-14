import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Panel, SettingsEditor, SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.hide()
  await Workspace.setFiles([])
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 5,
    value: 'terminal.integrated.shellIntegration.enabled',
  })
  await SettingsEditor.disableCheckBox({
    name: 'terminal.integrated.shellIntegration.enabled',
  })
  await Panel.hide()
}

export const run = async ({ Terminal, Editor, SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 5,
    value: 'terminal.integrated.shellIntegration.enabled',
  })
  await SettingsEditor.enableCheckBox({
    name: 'terminal.integrated.shellIntegration.enabled',
  })
  await Editor.closeAll()
  await Terminal.killAll()

  await Terminal.show({
    waitForReady: true,
  })

  // @ts-ignore
  await Terminal.shouldHaveIncompleteDecoration(true)

  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 5,
    value: 'terminal.integrated.shellIntegration.enabled',
  })
  await SettingsEditor.disableCheckBox({
    name: 'terminal.integrated.shellIntegration.enabled',
  })
  await Editor.closeAll()
  await Terminal.killAll()

  await Terminal.show({
    waitForReady: true,
  })

  // @ts-ignore
  await Terminal.shouldHaveIncompleteDecoration(false)

  await Terminal.killAll()
}

export const teardown = async ({ Editor, SettingsEditor, Terminal }: TestContext): Promise<void> => {
  await Editor.closeAll()
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
