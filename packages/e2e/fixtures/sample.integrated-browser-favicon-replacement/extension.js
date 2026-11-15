const vscode = require('vscode')

const http = require('node:http')
let server
let ready
let timeout
const setup = async () => {
  server = http.createServer((request, response) => {
    if (request.url.startsWith('/icon-')) {
      response.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' })
      response.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7XcAAAAASUVORK5CYII=', 'base64'))
      ready?.()
    } else {
      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.end('<!doctype html><title>Favicon lifecycle</title><h1>Favicon lifecycle</h1>')
    }
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(49231, '127.0.0.1', resolve)
  })
}
const run = async () => {
  try {
    await new Promise((resolve, reject) => {
      ready = resolve
      timeout = setTimeout(() => reject(new Error('Browser did not request replacement favicon')), 7000)
    })
  } finally {
    clearTimeout(timeout)
    ready = undefined
  }
}
const cleanup = async () => {
  clearTimeout(timeout)
  ready = undefined
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
  context.subscriptions.push(vscode.commands.registerCommand('integrated-browser-favicon-replacement.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-favicon-replacement.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Integrated Browser Favicon Replacement: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-favicon-replacement.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Integrated Browser Favicon Replacement: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-favicon-replacement.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Integrated Browser Favicon Replacement: cleanup complete')
    }),
  )
}
