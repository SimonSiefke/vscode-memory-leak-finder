import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test telemetry-related commands
  await QuickPick.showCommands()
  await QuickPick.type('telemetry')

  const telemetryCommands = await QuickPick.getVisibleCommands()
  const hasTelemetryCommands = telemetryCommands.some(
    (cmd) => cmd.toLowerCase().includes('telemetry') || cmd.toLowerCase().includes('privacy') || cmd.toLowerCase().includes('usage'),
  )

  if (hasTelemetryCommands) {
    await QuickPick.select('Preferences: Open Settings')
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
