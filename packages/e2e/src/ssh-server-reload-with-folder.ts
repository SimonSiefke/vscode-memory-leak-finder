import type { TestContext } from '../types.js'

const folderPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test-workspace'

let _options = {}

export const setup = async ({
  SshServer,
  SshClient,
  Extensions,
  Electron,
  SideBar,
  Panel,
  ActivityBar,
  Explorer,
}: TestContext): Promise<void> => {
  await Electron.mockOpenDialog({
    canceled: false,
    filePaths: [folderPath],
  })
  await Extensions.install({
    id: 'ms-vscode-remote.remote-ssh',
    name: 'Remote - SSH',
  })
  const connection = await SshServer.launch()
  _options = connection
  await SshClient.connectToSsh(connection)
  await ActivityBar.showExplorer()
  // @ts-ignore
  await SshClient.openFolder(connection)
  await SideBar.hide()
  await Panel.hide()
}

export const run = async ({ Workbench, SshClient }: TestContext): Promise<void> => {
  await Workbench.reload()
  // @ts-ignore
  await SshClient.connectToSshPart2(_options)
}

export const teardown = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.dispose()
}
