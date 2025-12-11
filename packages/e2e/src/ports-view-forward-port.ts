import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Panel, PortsView }: TestContext): Promise<void> => {
  await Panel.hide()
  await PortsView.open()
}

export const run = async ({ PortsView }: TestContext): Promise<void> => {
  const portId = 3000
  await PortsView.forwardPort(portId)
  await PortsView.shouldHaveForwardedPort(portId)
}
