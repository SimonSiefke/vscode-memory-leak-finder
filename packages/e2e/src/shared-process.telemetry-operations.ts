import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // Open command palette and search for telemetry-related commands
  await CommandPalette.open()
  await CommandPalette.type('telemetry')

  // Look for telemetry commands (these affect shared-process)
  const telemetryCommands = await CommandPalette.getVisibleCommands()
  const hasTelemetryCommands = telemetryCommands.some(
    (cmd) => cmd.toLowerCase().includes('telemetry') || cmd.toLowerCase().includes('privacy') || cmd.toLowerCase().includes('usage'),
  )

  if (hasTelemetryCommands) {
    try {
      await CommandPalette.select('Preferences: Open Settings')
      await CommandPalette.close()
    } catch (error) {
      // Telemetry commands might not be available, continue
    }
  }

  // Search for privacy settings
  await CommandPalette.type('privacy')
  const privacyCommands = await CommandPalette.getVisibleCommands()
  const hasPrivacyCommands = privacyCommands.some((cmd) => cmd.toLowerCase().includes('privacy') || cmd.toLowerCase().includes('data'))

  if (hasPrivacyCommands) {
    try {
      await CommandPalette.select('Preferences: Open Settings')
      await CommandPalette.close()
    } catch (error) {
      // Privacy commands might not be available, continue
    }
  }

  // Search for usage data commands
  await CommandPalette.type('usage')
  const usageCommands = await CommandPalette.getVisibleCommands()
  const hasUsageCommands = usageCommands.some((cmd) => cmd.toLowerCase().includes('usage') || cmd.toLowerCase().includes('analytics'))

  if (hasUsageCommands) {
    try {
      await CommandPalette.select('Preferences: Open Settings')
      await CommandPalette.close()
    } catch (error) {
      // Usage commands might not be available, continue
    }
  }

  // Perform actions that generate telemetry data
  await CommandPalette.type('help')
  const helpCommands = await CommandPalette.getVisibleCommands()
  const hasHelpCommands = helpCommands.some((cmd) => cmd.toLowerCase().includes('help'))

  if (hasHelpCommands) {
    try {
      await CommandPalette.select('Help: Show All Commands')
      await CommandPalette.close()
    } catch (error) {
      // Help commands might not be available, continue
    }
  }

  // Search for about commands (these often trigger telemetry)
  await CommandPalette.type('about')
  const aboutCommands = await CommandPalette.getVisibleCommands()
  const hasAboutCommands = aboutCommands.some((cmd) => cmd.toLowerCase().includes('about'))

  if (hasAboutCommands) {
    try {
      await CommandPalette.select('Help: About')
      await CommandPalette.close()
    } catch (error) {
      // About commands might not be available, continue
    }
  }

  // Close command palette
  await CommandPalette.close()

  // Reopen command palette to verify state
  await CommandPalette.open()
  await CommandPalette.type('help')
  await CommandPalette.close()
}
