const vscode = require('vscode')

let controller
let armed = false
let entered
let release
let iteration = 0
const setup = () => {
  controller = vscode.comments.createCommentController('lifecycle-ranges', 'Lifecycle ranges')
  controller.commentingRangeProvider = {
    provideCommentingRanges(document, token) {
      if (!armed) return []
      armed = false
      const pending = new Promise((resolve) => {
        release = () => resolve([new vscode.Range(0, 0, 0, 3)])
      })
      entered({ document, token })
      return pending
    },
  }
}
const run = async () => {
  let timeout
  const pending = new Promise((resolve, reject) => {
    entered = resolve
    timeout = setTimeout(() => reject(new Error('Comment range provider was not entered')), 7000)
  })
  const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, `comment-range-${++iteration}.txt`)
  try {
    await vscode.workspace.fs.writeFile(uri, Buffer.from('abc'))
    armed = true
    await vscode.window.showTextDocument(uri)
    const request = await pending
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
    release()
    await vscode.commands.executeCommand('setContext', 'comment-range-provider-cancel-on-close.closed', iteration)
    if (vscode.window.visibleTextEditors.some((editor) => editor.document === request.document))
      throw new Error('Comment editor remains visible')
  } finally {
    clearTimeout(timeout)
    release?.()
    release = undefined
    entered = undefined
    armed = false
    await vscode.workspace.fs.delete(uri)
  }
}
const cleanup = () => {
  controller?.dispose()
  controller = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('comment-range-provider-cancel-on-close.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-range-provider-cancel-on-close.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Comment Range Provider Cancel On Close: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-range-provider-cancel-on-close.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Comment Range Provider Cancel On Close: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-range-provider-cancel-on-close.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Comment Range Provider Cancel On Close: cleanup complete')
    }),
  )
}
