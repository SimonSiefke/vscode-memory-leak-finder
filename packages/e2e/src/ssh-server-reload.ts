import type { TestContext } from '../types.ts'

export const setup = async ({ SshServer, Workbench }: TestContext): Promise<void> => {
  await SshServer.launch()
  await SshServer.waitForPort()
  await SshServer.connect()
  await Workbench.shouldBeVisible()
  await SshServer.shouldBeConnected()
}

export const run = async ({ SshServer, Workbench }: TestContext): Promise<void> => {
  await Workbench.reload()
  await Workbench.shouldBeVisible()
  await SshServer.shouldBeConnected()
}

export const teardown = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.dispose()
}