import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'

export const launchIde = async ({ headlessMode, cwd, ide }) => {
  await LaunchVsCode.launchVsCode({ headlessMode, cwd })
}
