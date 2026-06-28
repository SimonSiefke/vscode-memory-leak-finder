import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = true

const chatSessionSettings = {
  'chat.viewSessions.enabled': true,
  'chat.viewSessions.orientation': 'sideBySide',
}

export const setup = async ({ ChatEditor, Editor, Electron, SideBar, Workspace }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Editor.closeAll()
  await Workspace.updateWorkspaceSettings(chatSessionSettings)
  await SideBar.showSecondary()
  await ChatEditor.openView()
  await ChatEditor.archiveAllActiveItems()
  await ChatEditor.shouldHaveNoActiveItems()
}

export const run = async ({ ChatEditor, SideBar }: TestContext): Promise<void> => {
  await SideBar.shouldSecondaryBeVisible()
  await ChatEditor.shouldBeVisibleInSecondarySideBar()
  await ChatEditor.sendMessage({
    message: 'Reply with exactly the word ready.',
    model: ChatEditor.Models.GPT41,
    expectedResponse: 'ready',
    verify: true,
  })
  await ChatEditor.focusSessionList()
  await ChatEditor.archiveFirstActiveItem()
  await ChatEditor.shouldHaveNoActiveItems()
}

export const teardown = async ({ ChatEditor, Editor, Electron, SideBar }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await SideBar.showSecondary()
  await ChatEditor.openView()
  await ChatEditor.archiveAllActiveItems()
  await Editor.closeAll()
}
