const vscode = require('vscode')

let provider
let iteration = 0
const setup = async () => {
  provider = await vscode.workspace.registerTunnelProvider(
    {
      provideTunnel: async (options) => {
        const ended = new vscode.EventEmitter()
        return {
          remoteAddress: options.remoteAddress,
          localAddress: `127.0.0.1:${options.remoteAddress.port}`,
          privacy: 'private',
          onDidDispose: ended.event,
          dispose() {
            ended.fire()
            ended.dispose()
          },
        }
      },
    },
    {},
  )
}
const run = async () => {
  const port = 36000 + ++iteration
  const tunnel = await vscode.workspace.openTunnel({ remoteAddress: { host: 'localhost', port } })
  if (!tunnel) throw new Error('Tunnel was not created')
  await tunnel.dispose()
  const active = await vscode.workspace.tunnels
  if (active.some((entry) => entry.remoteAddress.port === port)) throw new Error('Disposed tunnel remains active')
}
const cleanup = () => {
  provider?.dispose()
  provider = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('tunnel-provider-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('tunnel-provider-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Tunnel Provider Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('tunnel-provider-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Tunnel Provider Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('tunnel-provider-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Tunnel Provider Disposal: cleanup complete')
    }),
  )
}
