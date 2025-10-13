import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  // Open command palette and search for telemetry-related commands
  await QuickPick.showCommands()
  await QuickPick.type('telemetry')

  // Look for telemetry commands (these affect shared-process)
  const telemetryCommands = await QuickPick.getVisibleCommands()
  const hasTelemetryCommands = telemetryCommands.some(
    (cmd) => cmd.toLowerCase().includes('telemetry') || cmd.toLowerCase().includes('privacy') || cmd.toLowerCase().includes('usage'),
  )

  if (hasTelemetryCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Telemetry commands might not be available, continue
    }
  }

  // Search for privacy settings
  await QuickPick.showCommands()
  await QuickPick.type('privacy')
  const privacyCommands = await QuickPick.getVisibleCommands()
  const hasPrivacyCommands = privacyCommands.some((cmd) => cmd.toLowerCase().includes('privacy') || cmd.toLowerCase().includes('data'))

  if (hasPrivacyCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Privacy commands might not be available, continue
    }
  }

  // Search for usage data commands
  await QuickPick.showCommands()
  await QuickPick.type('usage')
  const usageCommands = await QuickPick.getVisibleCommands()
  const hasUsageCommands = usageCommands.some((cmd) => cmd.toLowerCase().includes('usage') || cmd.toLowerCase().includes('analytics'))

  if (hasUsageCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Usage commands might not be available, continue
    }
  }

  // Perform actions that generate telemetry data
  await QuickPick.showCommands()
  await QuickPick.type('help')
  const helpCommands = await QuickPick.getVisibleCommands()
  const hasHelpCommands = helpCommands.some((cmd) => cmd.toLowerCase().includes('help'))

  if (hasHelpCommands) {
    try {
      await QuickPick.select('Help: Show All Commands')
      await QuickPick.close()
    } catch (error) {
      // Help commands might not be available, continue
    }
  }

  // Search for about commands (these often trigger telemetry)
  await QuickPick.showCommands()
  await QuickPick.type('about')
  const aboutCommands = await QuickPick.getVisibleCommands()
  const hasAboutCommands = aboutCommands.some((cmd) => cmd.toLowerCase().includes('about'))

  if (hasAboutCommands) {
    try {
      await QuickPick.select('Help: About')
      await QuickPick.close()
    } catch (error) {
      // About commands might not be available, continue
    }
  }

  // Close command palette
  await QuickPick.close()

  // Reopen command palette to verify state
  await QuickPick.showCommands()
  await QuickPick.type('help')
  await QuickPick.close()
}
