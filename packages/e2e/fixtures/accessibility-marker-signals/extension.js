const vscode = require('vscode')

exports.activate = (context) => {
  const diagnostics = vscode.languages.createDiagnosticCollection('marker-signals')
  context.subscriptions.push(diagnostics)
  const root = vscode.workspace.workspaceFolders[0].uri
  const files = ['primary.txt', 'secondary.txt'].map((name) => vscode.Uri.joinPath(root, name))
  const result = vscode.Uri.joinPath(root, 'marker-signals-result.json')
  const publish = () => {
    for (const uri of files) {
      diagnostics.set(uri, [
        new vscode.Diagnostic(new vscode.Range(1, 0, 1, 5), 'Fixture error', vscode.DiagnosticSeverity.Error),
        new vscode.Diagnostic(new vscode.Range(3, 0, 3, 5), 'Fixture warning', vscode.DiagnosticSeverity.Warning),
      ])
    }
  }
  const cursor = (editor) => [editor.selection.active.line, editor.selection.active.character]
  const open = async (uri, selection) => vscode.window.showTextDocument(uri, { preview: false, ...(selection ? { selection } : {}) })
  const actions = {
    async setup() {
      publish()
      await open(files[1], new vscode.Range(3, 1, 3, 1))
      await open(files[0], new vscode.Range(1, 1, 1, 1))
    },
    async restore() {
      // Opening without a selection must restore the position saved for each tab.
      // Include close/reopen as well as reuse of the same editor pane.
      for (let round = 0; round < 5; round++) {
        for (const [index, uri] of files.entries()) {
          const editor = await open(uri)
          const expected = index === 0 ? [1, 1] : [3, 1]
          if (JSON.stringify(cursor(editor)) !== JSON.stringify(expected)) throw new Error('Cursor was not restored')
          editor.selection = new vscode.Selection(0, 0, 0, 0)
          editor.selection = new vscode.Selection(...expected, ...expected)
        }
      }
      await vscode.commands.executeCommand('workbench.action.closeAllEditors')
      const editor = await open(files[0])
      if (JSON.stringify(cursor(editor)) !== JSON.stringify([1, 1])) throw new Error('Closed editor cursor was not restored')
      await open(files[1])
      await open(files[0], new vscode.Range(1, 1, 1, 1))
    },
    async clear() {
      diagnostics.clear()
    },
    async publish() {
      const editor = vscode.window.activeTextEditor
      if (!editor || editor.document.uri.toString() !== files[0].toString()) throw new Error('Expected primary editor')
      if (JSON.stringify(cursor(editor)) !== JSON.stringify([1, 1])) throw new Error('Expected stationary cursor on error')
      publish()
    },
    async cleanup() {
      diagnostics.clear()
      await vscode.commands.executeCommand('workbench.action.closeAllEditors')
    },
  }
  for (const [action, run] of Object.entries(actions)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`marker-signals.${action}`, async () => {
        let error
        try {
          await run()
        } catch (cause) {
          error = String(cause?.stack || cause)
        }
        await vscode.workspace.fs.writeFile(result, new TextEncoder().encode(JSON.stringify({ action, error })))
      }),
    )
  }
}
