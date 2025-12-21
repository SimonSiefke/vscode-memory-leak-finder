import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Electron, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  const filePath = Workspace.getWorkspaceFilePath('exported-profile.code-profile')
  await Electron.mockSaveDialog({
    canceled: false,
    filePath,
  })
  await Electron.mockDialog({
    response: 0,
  })
  await Editor.closeAll()
}

export const run = async ({ Explorer, Profile, Workspace }: TestContext): Promise<void> => {
  await Profile.export({
    name: 'test',
  })
  await Explorer.shouldHaveItem('exported-profile.code-profile')
  await Workspace.setFiles([])
}
