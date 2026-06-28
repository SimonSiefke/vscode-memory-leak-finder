import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Electron, Extensions, SshServer, Workbench }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'ms-vscode-remote.remote-ssh',
    name: 'Remote - SSH',
  })
  const connection = await SshServer.launch()
  // @ts-ignore
  await Workbench.connectToSsh(connection)
}

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  // @ts-ignore
  await Workbench.reload()
}

export const teardown = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.dispose()
}
