import type { TestContext } from '../types.ts'

export const setup = async ({ SshServer, Workbench, Extensions, Electron, SideBar, Panel }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'ms-vscode-remote.remote-ssh',
    name: 'Remote - SSH',
  })
  const connection = await SshServer.launch()
  await Workbench.connectToSsh(connection)
  await SideBar.hide()
  await Panel.hide()
}

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  // @ts-ignore
  await Workbench.reload({
    isSsh: true,
  })
}

export const teardown = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.dispose()
}
