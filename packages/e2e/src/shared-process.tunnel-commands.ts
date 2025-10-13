import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test tunnel-related commands
  await QuickPick.showCommands()
  await QuickPick.type('tunnel')

  const tunnelCommands = await QuickPick.getVisibleCommands()
  const hasTunnelCommands = tunnelCommands.some((cmd) => cmd.toLowerCase().includes('tunnel') || cmd.toLowerCase().includes('remote'))

  if (hasTunnelCommands) {
    await QuickPick.select('Remote-Tunnels: Manage Tunnels')
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
