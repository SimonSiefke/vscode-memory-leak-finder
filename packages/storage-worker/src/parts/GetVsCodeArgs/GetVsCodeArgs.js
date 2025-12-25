import * as ChromiumSwitches from '../ChromiumSwitches/ChromiumSwitches.js'

/**
 * @param {{ extensionsDir: string; userDataDir: string; extraLaunchArgs: string[] }} param0
 */
export const getVscodeArgs = ({ extensionsDir, userDataDir, extraLaunchArgs }) => {
  return [
    ...ChromiumSwitches.chromiumSwitches,
    '--wait',
    '--new-window',
    '--no-sandbox',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
    '--disable-extensions',
    '--extensions-dir',
    extensionsDir,
    '--user-data-dir',
    userDataDir,
    ...extraLaunchArgs,
  ]
}
