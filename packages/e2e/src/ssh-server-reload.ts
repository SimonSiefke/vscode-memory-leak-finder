import type { TestContext } from '../types.ts'

export const setup = async ({ SshServer, SshClient, Extensions, Electron, SideBar, Panel }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'ms-vscode-remote.remote-ssh',
    name: 'Remote - SSH',
  })
  const connection = await SshServer.launch()
  await SshClient.connectToSsh(connection)
  await SideBar.hide()
  await Panel.hide()
}

export const run = async ({ Workbench, SshClient }: TestContext): Promise<void> => {
  await Workbench.reload()
  await SshClient.waitForConnectionReady({ alias: 'local-test' })
}

export const teardown = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.dispose()
}
