import type { TestContext } from '../types.ts'

export const setup = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.launch()
  await SshServer.connect()
  await SshServer.shouldBeConnected()
}

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  await Workbench.reload()
}

export const teardown = async ({ SshServer }: TestContext): Promise<void> => {
  await SshServer.dispose()
}
