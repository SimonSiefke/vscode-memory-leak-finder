import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, CommandPalette }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await CommandPalette.close()
}

export const run = async ({ CommandPalette, Editor }: TestContext): Promise<void> => {
  // Open command palette and search for tunnel-related commands
  await CommandPalette.open()
  await CommandPalette.type('tunnel')
  
  // Look for tunnel commands (these affect shared-process)
  const tunnelCommands = await CommandPalette.getVisibleCommands()
  const hasTunnelCommands = tunnelCommands.some(cmd => 
    cmd.toLowerCase().includes('tunnel') || 
    cmd.toLowerCase().includes('remote')
  )
  
  if (hasTunnelCommands) {
    try {
      // Try to access tunnel management
      await CommandPalette.select('Remote-Tunnels: Manage Tunnels')
      await CommandPalette.close()
    } catch (error) {
      // Tunnel commands might not be available, continue
    }
  }
  
  // Search for port forwarding commands
  await CommandPalette.type('port')
  const portCommands = await CommandPalette.getVisibleCommands()
  const hasPortCommands = portCommands.some(cmd => 
    cmd.toLowerCase().includes('port') || 
    cmd.toLowerCase().includes('forward')
  )
  
  if (hasPortCommands) {
    try {
      await CommandPalette.select('Ports: Focus on Ports View')
      await CommandPalette.close()
    } catch (error) {
      // Port commands might not be available, continue
    }
  }
  
  // Search for remote development commands
  await CommandPalette.type('remote')
  const remoteCommands = await CommandPalette.getVisibleCommands()
  const hasRemoteCommands = remoteCommands.some(cmd => 
    cmd.toLowerCase().includes('remote') || 
    cmd.toLowerCase().includes('ssh')
  )
  
  if (hasRemoteCommands) {
    try {
      await CommandPalette.select('Remote-SSH: Connect to Host...')
      await CommandPalette.close()
    } catch (error) {
      // Remote commands might not be available, continue
    }
  }
  
  // Search for network-related commands
  await CommandPalette.type('network')
  const networkCommands = await CommandPalette.getVisibleCommands()
  const hasNetworkCommands = networkCommands.some(cmd => 
    cmd.toLowerCase().includes('network') || 
    cmd.toLowerCase().includes('connection')
  )
  
  if (hasNetworkCommands) {
    try {
      await CommandPalette.select('Preferences: Open Settings')
      await CommandPalette.close()
    } catch (error) {
      // Network commands might not be available, continue
    }
  }
  
  // Close command palette
  await CommandPalette.close()
  
  // Reopen command palette to verify state
  await CommandPalette.open()
  await CommandPalette.type('help')
  await CommandPalette.close()
}
