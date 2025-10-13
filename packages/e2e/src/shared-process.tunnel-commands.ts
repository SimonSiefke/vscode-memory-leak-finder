import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test tunnel-related commands
  await QuickPick.showCommands()
  await QuickPick.type('tunnel')

  const tunnelCommands = await QuickPick.getVisibleCommands()
  const hasTunnelCommands = tunnelCommands.some((cmd) => cmd.toLowerCase().includes('tunnel') || cmd.toLowerCase().includes('remote'))

  if (hasTunnelCommands) {
    try {
      await QuickPick.select('Remote-Tunnels: Manage Tunnels')
      await QuickPick.close()
    } catch (error) {
      // Tunnel commands might not be available, continue
    }
  }

  await QuickPick.close()
}
