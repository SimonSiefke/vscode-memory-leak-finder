import type { TestContext } from '../types.ts'

export const skip = 1

const prefix = 'Explorer Rename Participant'

// The workbench cancels the participant token after this many milliseconds and
// then performs the rename without participant edits.
const participantsTimeout = 500

const dialogLog = 'globalThis.__vmlfRenameParticipantDialogs'

const expectedDialogMessage = `Extension '${prefix}' wants to make refactoring changes with this file move`

// Linux reorders native dialog buttons, so answer by label rather than index.
const mockShowMessageBox = `async (...args) => {
  const options = args.find((arg) => arg && Array.isArray(arg.buttons))
  const log = (${dialogLog} ??= [])
  log.push({ message: String(options?.message ?? ''), buttons: (options?.buttons ?? []).map(String) })
  const response = options ? options.buttons.findIndex((button) => String(button).replace(/[&_]/g, '') === 'OK') : -1
  return { response: response === -1 ? (options?.cancelId ?? 0) : response, checkboxChecked: false }
}`

type Context = Pick<TestContext, 'Notification' | 'QuickPick' | 'Workbench'>

const getNotificationText = async ({ Workbench }: Pick<TestContext, 'Workbench'>): Promise<unknown> => {
  return Workbench.evaluate({
    expression:
      "Array.from(document.querySelectorAll('.notification-list-item')).map(item => item.getAttribute('aria-label') || item.textContent).join(' | ')",
  })
}

const shouldHaveNoErrorNotifications = async ({ Workbench }: Pick<TestContext, 'Workbench'>): Promise<void> => {
  const errors = await Workbench.evaluate({
    expression:
      "Array.from(document.querySelectorAll('.notification-list-item')).map(item => item.getAttribute('aria-label') || '').filter(label => label.startsWith('Error')).join(' | ')",
  })
  if (errors) {
    throw new Error(`Unexpected error notifications: ${String(errors)}`)
  }
}

const runFixtureCommand = async ({ Notification, QuickPick, Workbench }: Context, command: string, expected: string): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand(`${prefix}: ${command}`)
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem(`${prefix}: ${expected}`)
  } catch (error) {
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(await getNotificationText({ Workbench }))}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

const getDialogs = async ({ Electron }: Pick<TestContext, 'Electron'>): Promise<Array<{ message: string; buttons: string[] }>> => {
  const json = await Electron.evaluate(`JSON.stringify(${dialogLog} ?? [])`)
  return JSON.parse(String(json))
}

export const setup = async ({ Electron, Explorer, Notification, QuickPick, Workbench, Workspace }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  await Workspace.setFiles([
    { content: 'source\n', name: 'source.txt' },
    { content: 'see source.txt\n', name: 'references.txt' },
  ])
  await Workspace.writeWorkspaceSettings({ 'files.participants.timeout': participantsTimeout })
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('source.txt')
  await Explorer.shouldHaveItem('references.txt')
  await Electron.evaluate(`${dialogLog} = []`)
  await Electron.mockElectron('dialog', 'showMessageBox', mockShowMessageBox)
  await runFixtureCommand({ Notification, QuickPick, Workbench }, 'Setup', `setup complete: participants timeout ${participantsTimeout}`)
}

export const run = async ({ Electron, Explorer, Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  const context = { Notification, QuickPick, Workbench }

  // The participant returns an edit; the confirmation is accepted and the edit is applied once.
  await runFixtureCommand(context, 'Arm Apply', 'apply armed')
  const dialogsBefore = (await getDialogs({ Electron })).length
  await Explorer.rename('source.txt', 'renamed.txt')
  const dialogs = await getDialogs({ Electron })
  if (dialogs.length !== dialogsBefore + 1 || dialogs.at(-1)?.message !== expectedDialogMessage) {
    throw new Error(`Expected one participant confirmation, got ${JSON.stringify(dialogs.slice(dialogsBefore))}`)
  }
  await runFixtureCommand(context, 'Verify Applied', 'apply verified')
  await Explorer.rename('renamed.txt', 'source.txt')

  // The participant holds past the timeout; the rename completes without its edit
  // and the late result is dropped.
  await runFixtureCommand(context, 'Arm Hold', 'hold armed')
  await Explorer.rename('source.txt', 'renamed.txt')
  await Notification.shouldHaveItem(`${prefix}: cancellation observed`)
  await shouldHaveNoErrorNotifications({ Workbench })
  await runFixtureCommand(context, 'Release', 'late completion observed')
  await runFixtureCommand(context, 'Verify Unchanged', 'unchanged verified')
  if ((await getDialogs({ Electron })).length !== dialogsBefore + 1) {
    throw new Error('A cancelled participant must not show a confirmation')
  }
  await Explorer.rename('renamed.txt', 'source.txt')
  await shouldHaveNoErrorNotifications({ Workbench })
}

export const teardown = async ({ Electron, Explorer, Notification, QuickPick, Workbench, Workspace }: TestContext): Promise<void> => {
  const context = { Notification, QuickPick, Workbench }
  try {
    await runFixtureCommand(context, 'Cleanup', 'cleanup complete')
    // A rename after cleanup must not reach the disposed listener.
    await Explorer.rename('source.txt', 'renamed.txt')
    await Explorer.rename('renamed.txt', 'source.txt')
    await runFixtureCommand(context, 'Verify Disposed', 'disposal verified')
  } finally {
    await Electron.unmockElectron('dialog', 'showMessageBox')
    await Electron.evaluate(`delete ${dialogLog}`)
    await Workspace.setFiles([])
  }
}
