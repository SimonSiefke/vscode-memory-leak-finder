import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SideBar, SettingsEditor, Terminal, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'terminal.integrated.shellIntegration.enabled',
    resultCount: 5,
  })
  await SettingsEditor.enableCheckBox({
    name: 'terminal.integrated.shellIntegration.enabled',
  })
  await Editor.closeAll()
  await Workspace.setFiles([])
  // @ts-ignore
  await Terminal.show({
    waitForReady: true,
  })
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  // @ts-ignore
  await Terminal.execute('echo hello > test.txt', {
    waitForFile: 'test.txt',
  })
  // @ts-ignore
  await Terminal.shouldHaveSuccessDecoration()
  await Terminal.clear()
}

export const teardown = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
}
