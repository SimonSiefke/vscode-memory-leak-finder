import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { TestContext } from '../types.ts'

export const skip = 1

const fileName = 'history.txt'
const initialContent = 'version one'
const dialogLogKey = '__vmlfLocalHistoryDialogs'

let cycle = 0

// Local history confirmations are native message boxes. Linux reverses the
// button order and turns "&&" mnemonics into "_", so answer by label instead
// of by index and record each answer.
const acceptLocalHistoryDialog = `(...args) => {
  const options = args.find((arg) => arg && Array.isArray(arg.buttons))
  const labels = options ? options.buttons.map((button) => String(button).replaceAll(/[&_]/g, '')) : []
  const accepted = ['Restore', 'Delete', 'Delete All']
  let response = labels.findIndex((label) => accepted.includes(label))
  globalThis['${dialogLogKey}'].push(response === -1 ? 'unexpected: ' + labels.join(' | ') : labels[response])
  if (response === -1) {
    response = Math.max(labels.indexOf('Cancel'), 0)
  }
  return Promise.resolve({ checkboxChecked: false, response })
}`

const takeDialogLog = async ({ Electron }: TestContext): Promise<unknown> => {
  return Electron.evaluate(`(() => {
  const log = globalThis['${dialogLogKey}']
  globalThis['${dialogLogKey}'] = []
  return log
})()`)
}

const readHistoryFile = async ({ Workspace }: TestContext): Promise<string> => {
  return readFile(join(Workspace.getWorkspacePath(), fileName), 'utf8')
}

const deleteAllLocalHistory = async ({ QuickPick }: TestContext): Promise<void> => {
  await QuickPick.executeCommand('Local History: Delete All')
}

const createLocalHistoryEntry = async ({ QuickPick }: TestContext, name: string): Promise<void> => {
  // The command opens a second input box for the entry name.
  await QuickPick.executeCommand('Local History: Create Entry', { stayVisible: true })
  await QuickPick.type(name)
  await QuickPick.pressEnter()
}

export const setup = async (context: TestContext): Promise<void> => {
  const { ActivityBar, Editor, Electron, Timeline, Workspace } = context
  await Workspace.setFiles([
    {
      content: initialContent,
      name: fileName,
    },
  ])
  await Editor.closeAll()
  await Electron.evaluate(`globalThis['${dialogLogKey}'] = []`)
  await Electron.mockElectron('dialog', 'showMessageBox', acceptLocalHistoryDialog)
  // Local history lives in the user data directory and survives earlier runs.
  await deleteAllLocalHistory(context)
  assert.deepEqual(await takeDialogLog(context), ['Delete All'])
  await ActivityBar.showExplorer()
  await Editor.open(fileName)
  await Editor.shouldHaveText(initialContent)
  await Timeline.open(fileName)
  await Timeline.shouldHaveItemCount(0)
}

export const run = async (context: TestContext): Promise<void> => {
  const { DiffEditor, Editor, Timeline } = context
  cycle++
  const firstEntry = `cycle-${cycle}-v1`
  const secondEntry = `cycle-${cycle}-v2`
  const editedContent = `version two ${cycle}`

  await createLocalHistoryEntry(context, firstEntry)
  await Timeline.shouldHaveItem(firstEntry)

  // Opening the timeline and the quick input moves focus away from the editor.
  await Editor.focus()
  await Editor.deleteAll()
  await Editor.type(editedContent)
  await Editor.save({ viaKeyBoard: true })
  assert.equal(await readHistoryFile(context), editedContent)
  await Timeline.shouldHaveItem('File Saved')

  await createLocalHistoryEntry(context, secondEntry)
  await Timeline.shouldHaveItem(secondEntry)
  await Timeline.shouldHaveItemCount(3)

  await Timeline.runItemAction(firstEntry, 'Compare with File')
  await DiffEditor.shouldHaveOriginalEditor(initialContent)
  await DiffEditor.shouldHaveModifiedEditor(editedContent)
  await Editor.close()

  await Timeline.runItemAction(firstEntry, 'Restore Contents')
  await Editor.shouldHaveText(initialContent, fileName)
  assert.equal(await readHistoryFile(context), initialContent)
  await Timeline.shouldHaveItem('File Restored')
  await Timeline.shouldHaveItemCount(4)

  await Timeline.runItemAction(secondEntry, 'Delete')
  await Timeline.shouldNotHaveItem(secondEntry)
  await Timeline.shouldHaveItemCount(3)

  await deleteAllLocalHistory(context)
  await Timeline.shouldNotHaveItem(firstEntry)
  await Timeline.shouldHaveItemCount(0)
  assert.deepEqual(await takeDialogLog(context), ['Restore', 'Delete', 'Delete All'])
}

export const teardown = async (context: TestContext): Promise<void> => {
  const { Editor, Electron, Timeline } = context
  try {
    await Timeline.shouldHaveItemCount(0)
    await Editor.closeAll()
    assert.deepEqual(await takeDialogLog(context), [])
  } finally {
    await Electron.unmockElectron('dialog', 'showMessageBox')
    await Electron.evaluate(`delete globalThis['${dialogLogKey}']`)
  }
}
