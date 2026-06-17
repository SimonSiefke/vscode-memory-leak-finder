import type { TestContext } from '../types.js'

export const skip = 1

let connection: any

export const setup = async ({ SshServer, Extensions, Electron }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'ms-vscode-remote.remote-ssh',
    name: 'Remote - SSH',
  })
  connection = await SshServer.launch()
}

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  const secondWindow = await Workbench.openNewWindow()
  await secondWindow.shouldBeVisible()
  await secondWindow.Workbench.connectToSsh(connection)
  await secondWindow.shouldBeVisible()
  await secondWindow.close()
}

export const teardown = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.dispose()
}
