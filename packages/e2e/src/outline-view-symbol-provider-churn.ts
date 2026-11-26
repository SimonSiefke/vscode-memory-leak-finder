import type { TestContext } from '../types.ts'

export const skip = 1

const alpha = 'alpha.outline-fixture'
const beta = 'beta.outline-fixture'
const alphaSymbols = ['alphaOne', 'alphaTwo', 'alphaThree']
const betaSymbols = ['betaOne', 'betaTwo']
const noEditorMessage = 'The active editor cannot provide outline information.'

const toContent = (symbols: readonly string[]): string => symbols.map((symbol) => `symbol ${symbol}\n`).join('')

const executeFixtureCommand = async (
  { Notification, QuickPick }: Pick<TestContext, 'Notification' | 'QuickPick'>,
  command: string,
  message: string,
): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand(`Outline View Symbol Provider Churn: ${command}`)
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem(`Outline View Symbol Provider Churn: ${message}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const setup = async ({ Editor, Notification, Outline, QuickPick, SideBar, Workspace }: TestContext): Promise<void> => {
  // Reopened editors otherwise restore the previous cycle's cursor, which would hide a failed navigation.
  await Workspace.setFiles([
    { content: toContent(alphaSymbols), name: alpha },
    { content: toContent(betaSymbols), name: beta },
    { content: JSON.stringify({ 'workbench.editor.restoreViewState': false }, null, 2) + '\n', name: '.vscode/settings.json' },
  ])
  await Editor.closeAll()
  await executeFixtureCommand({ Notification, QuickPick }, 'Cleanup', 'cleanup complete')
  await SideBar.show()
  await Outline.focus()
  await Outline.shouldHaveMessage(noEditorMessage)
}

export const run = async ({ Editor, Notification, Outline, QuickPick }: TestContext): Promise<void> => {
  await executeFixtureCommand({ Notification, QuickPick }, 'Register Provider', 'provider registered')

  await Editor.open(alpha)
  await Outline.shouldHaveSymbols(alphaSymbols)
  await Editor.shouldHaveActiveLineNumber(1)
  // The Outline view keeps each document's tree selection, so each click must change the selection.
  await Outline.select('alphaTwo')
  await Editor.shouldHaveActiveLineNumber(2)
  await Outline.select('alphaThree')
  await Editor.shouldHaveActiveLineNumber(3)

  await Editor.open(beta)
  await Outline.shouldHaveSymbols(betaSymbols)

  // The fixture rejects disposal while a symbol request is still in flight.
  await executeFixtureCommand({ Notification, QuickPick }, 'Dispose Provider', 'provider disposed after')
  await Outline.shouldHaveMessage(`No symbols found in document '${beta}'`)

  await Editor.closeAll()
  await Outline.shouldHaveMessage(noEditorMessage)
}

export const teardown = async ({ Editor, Notification, QuickPick, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await executeFixtureCommand({ Notification, QuickPick }, 'Cleanup', 'cleanup complete')
  await SideBar.hide()
}
