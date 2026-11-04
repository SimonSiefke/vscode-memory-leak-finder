import type { TestContext } from '../types.js'

const folderPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test-workspace'

const waitForFolderTitle = async (Electron: TestContext['Electron']): Promise<void> => {
  const timeout = 30_000
  const start = performance.now()
  while (performance.now() - start < timeout) {
    const title = (await Electron.evaluate(`(() => {
      const { BrowserWindow } = globalThis._____electron
      const window = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
      return window ? window.getTitle() : ''
    })()`)) as unknown as string
    if (title.includes('.vscode-test-workspace')) {
      return
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
  }
  throw new Error('Expected opened folder to appear in the window title')
}

export const setup = async ({
  SshServer,
  Workbench,
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
  // @ts-ignore
  await Workbench.connectToSsh(connection)
  await ActivityBar.showExplorer()
  // @ts-ignore
  await Explorer.openFolder()
  await waitForFolderTitle(Electron)
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
