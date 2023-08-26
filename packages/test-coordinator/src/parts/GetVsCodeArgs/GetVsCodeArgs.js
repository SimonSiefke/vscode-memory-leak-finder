import * as ChromiumSwitches from '../ChromiumSwitches/ChromiumSwitches.js'

export const getVscodeArgs = ({ userDataDir, extraLaunchArgs }) => {
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
    '--user-data-dir',
    userDataDir,
    ...extraLaunchArgs,
  ]
}
