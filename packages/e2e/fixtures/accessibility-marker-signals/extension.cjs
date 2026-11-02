const { readFile, rename, writeFile } = require('node:fs/promises')

exports.activate = (context, vscode) => {
  const diagnostics = vscode.languages.createDiagnosticCollection('marker-signals')
  context.subscriptions.push(diagnostics)
  const root = vscode.workspace.workspaceFolders[0].uri
  const files = ['primary.txt', 'secondary.txt'].map((name) => vscode.Uri.joinPath(root, name))
  const result = vscode.Uri.joinPath(root, 'marker-signals-result.json')
  const acknowledgement = vscode.Uri.joinPath(root, 'marker-signals-continue.txt')
  const writeResult = async (value) => {
    const temporary = vscode.Uri.joinPath(root, 'marker-signals-result.tmp')
    await writeFile(temporary.fsPath, JSON.stringify(value))
    await rename(temporary.fsPath, result.fsPath)
  }
  const waitForAcknowledgement = async (expected) => {
    const deadline = Date.now() + 10_000
    while (Date.now() < deadline) {
      try {
        if ((await readFile(acknowledgement.fsPath, 'utf8')) === expected) return
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    throw new Error(`Driver did not acknowledge ${expected}`)
  }
  const publish = () => {
    for (const uri of files) {
      diagnostics.set(uri, [
        new vscode.Diagnostic(new vscode.Range(1, 0, 1, 5), 'Fixture error', vscode.DiagnosticSeverity.Error),
        new vscode.Diagnostic(new vscode.Range(3, 0, 3, 5), 'Fixture warning', vscode.DiagnosticSeverity.Warning),
      ])
    }
  }
  const cursor = (editor) => [editor.selection.active.line, editor.selection.active.character]
  const waitForCursor = async (editor, expected) => {
    const deadline = Date.now() + 3000
    while (JSON.stringify(cursor(editor)) !== JSON.stringify(expected)) {
      if (Date.now() >= deadline)
        throw new Error(`Cursor mismatch in ${editor.document.uri.path}: expected ${expected}, actual ${cursor(editor)}`)
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
  const open = async (uri, selection) => {
    const editor = await vscode.window.showTextDocument(uri, { preview: false, ...(selection ? { selection } : {}) })
    if (selection) await waitForCursor(editor, [selection.start.line, selection.start.character])
    return editor
  }
  const settings = {
    'accessibility.signalOptions.debouncePositionChanges': false,
    'editor.accessibilitySupport': 'on',
    'accessibility.signals.lineHasError': { sound: 'off', announcement: 'auto' },
    'accessibility.signals.lineHasWarning': { sound: 'off', announcement: 'auto' },
    'accessibility.signals.positionHasError': { sound: 'off', announcement: 'auto' },
    'accessibility.signals.positionHasWarning': { sound: 'off', announcement: 'auto' },
    'editor.stickyScroll.enabled': false,
    'git.enabled': false,
  }
  const actions = {
    async setup() {
      // The harness excludes its workspace from filesystem watching. Use the
      // configuration API so the live workbench receives these changes.
      for (const [key, value] of Object.entries(settings)) {
        await vscode.workspace.getConfiguration().update(key, value, vscode.ConfigurationTarget.Workspace)
      }
      publish()
      await open(files[1], new vscode.Range(3, 1, 3, 1))
      await open(files[0], new vscode.Range(1, 1, 1, 1))
    },
    async restore() {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors')
      await open(files[1], new vscode.Range(3, 1, 3, 1))
      await open(files[0], new vscode.Range(1, 1, 1, 1))
    },
    async error() {
      await open(files[0], new vscode.Range(1, 1, 1, 1))
    },
    async warning() {
      await open(files[0], new vscode.Range(3, 1, 3, 1))
    },
    async update() {
      diagnostics.clear()
      const editor = await open(files[0], new vscode.Range(1, 1, 1, 1))
      await writeResult({ action: 'update', phase: 'cleared' })
      // No palette or cursor commands occur between the driver's acknowledgement
      // of the empty decorations and this diagnostic update.
      await waitForAcknowledgement('update:publish')
      if (JSON.stringify(cursor(editor)) !== JSON.stringify([1, 1])) throw new Error('Expected stationary cursor on error')
      publish()
    },
    async reset() {
      // Navigation history intentionally keeps selections in bounded stacks.
      // Each measured iteration starts from the same history state.
      await vscode.commands.executeCommand('workbench.action.clearEditorHistoryWithoutConfirm')
      await open(files[0], new vscode.Range(1, 1, 1, 1))
    },
    async cleanup() {
      diagnostics.clear()
      await vscode.commands.executeCommand('workbench.action.closeAllEditors')
      for (const key of Object.keys(settings)) {
        await vscode.workspace.getConfiguration().update(key, undefined, vscode.ConfigurationTarget.Workspace)
      }
    },
  }
  for (const [action, run] of Object.entries(actions)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`marker-signals.${action}`, async () => {
        let error
        try {
          // Wait until the command palette has closed before changing editors.
          await waitForAcknowledgement(`${action}:start`)
          await run()
        } catch (cause) {
          error = String(cause?.stack || cause)
        }
        await writeResult({ action, phase: 'done', error })
      }),
    )
  }
}
