import * as ChromiumSwitches from '../ChromiumSwitches/ChromiumSwitches.js'

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
