const vscode = require('vscode')

let controller
let thread
let editor
let iteration = 0
class ReplacementComment {
  constructor(value) {
    this.body = `Replacement comment ${value}`
    this.mode = vscode.CommentMode.Preview
    this.author = { name: 'Lifecycle fixture' }
  }
}
const setup = async () => {
  controller = vscode.comments.createCommentController('replacement-comments', 'Replacement comments')
  editor = await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'Review this line' }),
  )
  thread = controller.createCommentThread(editor.document.uri, new vscode.Range(0, 0, 0, 0), [])
  thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded
}
const run = async () => {
  thread.comments = [new ReplacementComment(++iteration)]
  // ExtHostComments batches updates with a 100ms debounce. Allow that batch to
  // leave the host before the next replacement, so iterations cannot coalesce.
  await new Promise((resolve) => setTimeout(resolve, 200))
  await vscode.commands.executeCommand('setContext', 'comment-thread-comment-replacement.iteration', iteration)
}
const cleanup = async () => {
  thread?.dispose()
  thread = undefined
  controller?.dispose()
  controller = undefined
  editor = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('comment-thread-comment-replacement.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-thread-comment-replacement.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Comment Thread Comment Replacement: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-thread-comment-replacement.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Comment Thread Comment Replacement: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-thread-comment-replacement.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Comment Thread Comment Replacement: cleanup complete')
    }),
  )
}
