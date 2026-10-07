const vscode = require('vscode')

const http = require('node:http')
let server
let tab
let session
let sequence = 0
let pageSession
let attached
let detached
let events
const request = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++sequence
    const timeout = setTimeout(() => {
      listener.dispose()
      reject(new Error(`CDP ${method} timed out`))
    }, 7000)
    const listener = session.onDidReceiveMessage((message) => {
      if (message.id !== id) return
      clearTimeout(timeout)
      listener.dispose()
      if (message.error) reject(new Error(JSON.stringify(message.error)))
      else resolve(message.result)
    })
    session.sendMessage({ id, method, params, sessionId }).catch((error) => {
      clearTimeout(timeout)
      listener.dispose()
      reject(error)
    })
  })
const setup = async () => {
  server = http.createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' })
    response.end('<!doctype html><title>Cross-site lifecycle</title><h1>Cross-site lifecycle</h1>')
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(49233, '127.0.0.1', resolve)
  })
  tab = await vscode.window.openBrowserTab('http://127.0.0.1:49233')
  session = await tab.startCDPSession()
  const targets = await request('Target.getTargets')
  const target = targets.targetInfos.find((target) => target.type === 'page')
  if (!target) throw new Error('Browser page target missing')
  pageSession = (await request('Target.attachToTarget', { targetId: target.targetId, flatten: true })).sessionId
  events = session.onDidReceiveMessage((message) => {
    if (message.method === 'Target.attachedToTarget' && message.params.targetInfo.type === 'iframe') attached?.(message.params.sessionId)
    if (message.method === 'Target.detachedFromTarget') detached?.(message.params.sessionId)
  })
  await request('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, pageSession)
}
const run = async () => {
  let attachTimeout
  let detachTimeout
  let child
  const didAttach = new Promise((resolve, reject) => {
    attached = resolve
    attachTimeout = setTimeout(() => reject(new Error('Cross-site iframe did not create a separate CDP target')), 7000)
  })
  try {
    await request(
      'Runtime.evaluate',
      {
        expression:
          "(() => { const frame = document.createElement('iframe'); frame.id = 'lifecycle-frame'; frame.src = 'http://localhost:49233'; document.body.append(frame); })()",
      },
      pageSession,
    )
    child = await didAttach
    clearTimeout(attachTimeout)
    const didDetach = new Promise((resolve, reject) => {
      detached = (id) => {
        if (id === child) resolve()
      }
      detachTimeout = setTimeout(() => reject(new Error('Iframe target did not detach')), 7000)
    })
    await request('Runtime.evaluate', { expression: "document.querySelector('#lifecycle-frame').remove()" }, pageSession)
    await didDetach
  } finally {
    clearTimeout(attachTimeout)
    clearTimeout(detachTimeout)
    attached = undefined
    detached = undefined
  }
}
const cleanup = async () => {
  events?.dispose()
  events = undefined
  await session?.close()
  session = undefined
  await tab?.close()
  tab = undefined
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
  context.subscriptions.push(vscode.commands.registerCommand('integrated-browser-cross-site-frame-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-cross-site-frame-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Integrated Browser Cross Site Frame Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-cross-site-frame-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Integrated Browser Cross Site Frame Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-cross-site-frame-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Integrated Browser Cross Site Frame Disposal: cleanup complete')
    }),
  )
}
