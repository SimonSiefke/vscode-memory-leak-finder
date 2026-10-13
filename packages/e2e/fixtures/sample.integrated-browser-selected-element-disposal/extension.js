const vscode = require('vscode')

const http = require('node:http')
let server
const setup = async () => {
  server = http.createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' })
    response.end('<!doctype html><title>Selection lifecycle</title><a id="lifecycle" href="#selected">Selected lifecycle element</a>')
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(49234, '127.0.0.1', resolve)
  })
}
const run = async () => {
  await vscode.commands.executeCommand('workbench.action.browser.addElementToChat')
}
const cleanup = async () => {
  if (server) {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    server = undefined
  }
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('integrated-browser-selected-element-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-selected-element-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Integrated Browser Selected Element Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-selected-element-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Integrated Browser Selected Element Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-selected-element-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Integrated Browser Selected Element Disposal: cleanup complete')
    }),
  )
}
