import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, RunningExtensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await RunningExtensions.show()
}

export const run = async ({ RunningExtensions }: TestContext): Promise<void> => {
  await RunningExtensions.startProfilingExtensionHost()
  await RunningExtensions.stopProfilingExtensionHost()
}
