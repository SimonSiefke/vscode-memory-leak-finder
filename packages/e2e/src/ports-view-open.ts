import type { TestContext } from '../types.ts'

export const skip = 1

export const run = async ({ PortsView }: TestContext): Promise<void> => {
  await PortsView.open()
  await PortsView.close()
}
