const vscode = require('vscode')

let editor
const setup = async () => {
  editor = await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'Inset host\nSecond line' }),
  )
}
const run = async () => {
  const inset = vscode.window.createWebviewTextEditorInset(editor, 0, 4, { enableScripts: true })
  let listener
  let timeout
  const loaded = new Promise((resolve, reject) => {
    listener = inset.webview.onDidReceiveMessage((message) => {
      if (message === 'ready') resolve()
    })
    timeout = setTimeout(() => reject(new Error('Inset webview did not load')), 7000)
  })
  try {
    inset.webview.html = '<!doctype html><html><body>Lifecycle inset<script>acquireVsCodeApi().postMessage("ready")</script></body></html>'
    await loaded
  } finally {
    clearTimeout(timeout)
    listener.dispose()
    inset.dispose()
  }
}
const cleanup = async () => {
  editor = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('editor-webview-inset-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('editor-webview-inset-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Editor Webview Inset Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('editor-webview-inset-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Editor Webview Inset Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('editor-webview-inset-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Editor Webview Inset Disposal: cleanup complete')
    }),
  )
}
