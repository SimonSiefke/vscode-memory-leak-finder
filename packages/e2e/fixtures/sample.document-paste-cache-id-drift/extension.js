const vscode = require('vscode')

let provider
let requests = 0
let document
const setup = () => {
  provider = vscode.languages.registerDocumentPasteEditProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      provideDocumentPasteEdits() {
        requests++
        if (requests % 3 !== 0) return undefined
        return [new vscode.DocumentPasteEdit('accepted lifecycle paste', 'Lifecycle paste', vscode.DocumentDropOrPasteEditKind.Text)]
      },
    },
    { pasteMimeTypes: ['text/plain'], providedPasteEditKinds: [vscode.DocumentDropOrPasteEditKind.Text] },
  )
}
const run = async () => {
  document = await vscode.workspace.openTextDocument({ language: 'plaintext', content: '' })
  await vscode.window.showTextDocument(document)
  const before = requests
  await vscode.env.clipboard.writeText('lifecycle clipboard')
  for (let index = 0; index < 3; index++) {
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction')
    if (requests !== before + index + 1) throw new Error('Paste provider request count did not advance')
  }
  if (!document.getText().includes('accepted lifecycle paste')) throw new Error('Accepted paste edit was not applied')
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  document = undefined
}
const cleanup = () => {
  provider?.dispose()
  provider = undefined
  document = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('document-paste-cache-id-drift.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('document-paste-cache-id-drift.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Document Paste Cache Id Drift: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('document-paste-cache-id-drift.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Document Paste Cache Id Drift: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('document-paste-cache-id-drift.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Document Paste Cache Id Drift: cleanup complete')
    }),
  )
}
