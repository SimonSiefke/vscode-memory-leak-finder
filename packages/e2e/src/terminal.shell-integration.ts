import type { TestContext } from '../types.ts'

export const skip = 1

<<<<<<< HEAD
export const setup = async ({ Editor, Panel, SideBar, SettingsEditor, Terminal, Workspace }: TestContext): Promise<void> => {
=======
export const setup = async ({ Editor, Panel, SettingsEditor, SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
>>>>>>> origin/main
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.hide()
  await SettingsEditor.open()
  await SettingsEditor.search({
<<<<<<< HEAD
    value: 'terminal.integrated.shellIntegration.enabled',
    resultCount: 5,
=======
    resultCount: 5,
    value: 'terminal.integrated.shellIntegration.enabled',
>>>>>>> origin/main
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

export const run = async ({ Terminal, Workspace }: TestContext): Promise<void> => {
  // @ts-ignore
  await Terminal.execute('echo hello > test.txt', {
    waitForFile: 'test.txt',
  })
  // @ts-ignore
  await Terminal.shouldHaveSuccessDecoration()
  await Terminal.clear()
  await Workspace.remove('test.txt')
}

<<<<<<< HEAD
export const teardown = async ({ Editor, Terminal, SettingsEditor }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'terminal.integrated.shellIntegration.enabled',
    resultCount: 5,
=======
export const teardown = async ({ Editor, SettingsEditor, Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 5,
    value: 'terminal.integrated.shellIntegration.enabled',
>>>>>>> origin/main
  })
  await SettingsEditor.disableCheckBox({
    name: 'terminal.integrated.shellIntegration.enabled',
  })
  await Editor.closeAll()
}
