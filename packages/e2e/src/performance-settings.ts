import type { TestContext } from '../types.ts'
export { setup, teardown } from '../helpers/performanceFixtures.ts'
export const skip = true
export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.open()
}
