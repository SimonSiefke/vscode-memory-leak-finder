const vscode = require('vscode')

const http = require('node:http')
let server
let port
let iteration = 0
const setup = async () => {
  server = http.createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' })
    response.end(
      '<html><title>Lifecycle extraction</title><body><h1>Lifecycle extraction</h1>' +
        '<p>Local page content for extraction.</p>'.repeat(20) +
        '</body></html>',
    )
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  port = server.address().port
}
const run = async () => {
  const result = await vscode.lm.invokeTool('vscode_fetchWebPage_internal', {
    input: { urls: [`http://127.0.0.1:${port}/page-${++iteration}`] },
  })
  const text = result.content
    .filter((part) => part instanceof vscode.LanguageModelTextPart)
    .map((part) => part.value)
    .join('\n')
  if (!text.includes('Lifecycle extraction')) throw new Error('Page extraction did not return the fixture content')
}
const cleanup = async () => {
  if (server) {
    const current = server
    server = undefined
    await new Promise((resolve, reject) => current.close((error) => (error ? reject(error) : resolve())))
  }
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('web-page-loader-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('web-page-loader-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Web Page Loader Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('web-page-loader-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Web Page Loader Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('web-page-loader-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Web Page Loader Disposal: cleanup complete')
    }),
  )
}
