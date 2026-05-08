import type { TestContext } from '../types.js'

const folderPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test-workspace'

export const setup = async ({ SshServer, Workbench, Extensions, Electron, SideBar, Panel, ActivityBar, Explorer }: TestContext): Promise<void> => {
  await Electron.mockOpenDialog({
    canceled: false,
    filePaths: [folderPath],
  })
  await Extensions.install({
    id: 'ms-vscode-remote.remote-ssh',
    name: 'Remote - SSH',
  })
  const connection = await SshServer.launch()
  await Workbench.connectToSsh(connection)
  await ActivityBar.showExplorer()
  await Explorer.openFolder()
  await Explorer.shouldHaveItem('.vscode-test-workspace')
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
