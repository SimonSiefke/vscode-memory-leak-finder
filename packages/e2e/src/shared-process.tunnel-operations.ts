import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Open command palette and search for tunnel-related commands
  await QuickPick.showCommands()
  await QuickPick.type('tunnel')

  // Look for tunnel commands (these affect shared-process)
  const tunnelCommands = await QuickPick.getVisibleCommands()
  const hasTunnelCommands = tunnelCommands.some((cmd) => cmd.toLowerCase().includes('tunnel') || cmd.toLowerCase().includes('remote'))

  if (hasTunnelCommands) {
    try {
      // Try to access tunnel management
      await QuickPick.select('Remote-Tunnels: Manage Tunnels')
      await QuickPick.close()
    } catch (error) {
      // Tunnel commands might not be available, continue
    }
  }

  // Search for port forwarding commands
  await QuickPick.showCommands()
  await QuickPick.type('port')
  const portCommands = await QuickPick.getVisibleCommands()
  const hasPortCommands = portCommands.some((cmd) => cmd.toLowerCase().includes('port') || cmd.toLowerCase().includes('forward'))

  if (hasPortCommands) {
    try {
      await QuickPick.select('Ports: Focus on Ports View')
      await QuickPick.close()
    } catch (error) {
      // Port commands might not be available, continue
    }
  }

  // Search for remote development commands
  await QuickPick.showCommands()
  await QuickPick.type('remote')
  const remoteCommands = await QuickPick.getVisibleCommands()
  const hasRemoteCommands = remoteCommands.some((cmd) => cmd.toLowerCase().includes('remote') || cmd.toLowerCase().includes('ssh'))

  if (hasRemoteCommands) {
    try {
      await QuickPick.select('Remote-SSH: Connect to Host...')
      await QuickPick.close()
    } catch (error) {
      // Remote commands might not be available, continue
    }
  }

  // Search for network-related commands
  await QuickPick.showCommands()
  await QuickPick.type('network')
  const networkCommands = await QuickPick.getVisibleCommands()
  const hasNetworkCommands = networkCommands.some(
    (cmd) => cmd.toLowerCase().includes('network') || cmd.toLowerCase().includes('connection'),
  )

  if (hasNetworkCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Network commands might not be available, continue
    }
  }

  // Close command palette
  await QuickPick.close()

  // Reopen command palette to verify state
  await QuickPick.showCommands()
  await QuickPick.type('help')
  await QuickPick.close()
}
