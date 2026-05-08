import type { TestContext } from '../types.ts'

export const setup = async ({ SshServer, Workbench }: TestContext): Promise<void> => {
  const connection = await SshServer.launch()
  await Workbench.connectToSsh(connection)
  await SshServer.shouldBeConnected(connection)
}

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  await Workbench.reload()
}

export const teardown = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.dispose()
}
