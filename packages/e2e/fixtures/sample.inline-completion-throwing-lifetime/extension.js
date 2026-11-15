const vscode = require('vscode')

let provider
let armed = false
let shown
let ended
class ThrowingCompletionList {
  items = [{ insertText: 'lifecycle completion' }]
}
const setup = async () => {
  provider = vscode.languages.registerInlineCompletionItemProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      provideInlineCompletionItems: () => (armed ? new ThrowingCompletionList() : undefined),
      handleDidShowCompletionItem: () => shown?.(),
      handleListEndOfLifetime() {
        ended?.()
        throw new Error('Expected lifecycle fixture lifetime callback failure')
      },
    },
  )
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ language: 'plaintext', content: '' }))
}
const run = async () => {
  let shownTimeout
  let endedTimeout
  const didShow = new Promise((resolve, reject) => {
    shown = resolve
    shownTimeout = setTimeout(() => reject(new Error('Inline completion did not appear')), 5000)
  })
  const didEnd = new Promise((resolve, reject) => {
    ended = resolve
    endedTimeout = setTimeout(() => reject(new Error('Lifetime hook was not invoked')), 7000)
  })
  try {
    armed = true
    await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger')
    await didShow
    armed = false
    await vscode.commands.executeCommand('editor.action.inlineSuggest.hide')
    await didEnd
    await vscode.commands.executeCommand('setContext', 'inline-completion-throwing-lifetime.finished', true)
  } finally {
    clearTimeout(shownTimeout)
    clearTimeout(endedTimeout)
    shown = undefined
    ended = undefined
    armed = false
  }
}
const cleanup = async () => {
  provider?.dispose()
  provider = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('inline-completion-throwing-lifetime.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('inline-completion-throwing-lifetime.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Inline Completion Throwing Lifetime: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('inline-completion-throwing-lifetime.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Inline Completion Throwing Lifetime: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('inline-completion-throwing-lifetime.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Inline Completion Throwing Lifetime: cleanup complete')
    }),
  )
}
