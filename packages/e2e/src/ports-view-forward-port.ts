import type { TestContext } from '../types.ts'

export const skip = 0

export const setup = async ({ Panel, PortsView }: TestContext): Promise<void> => {
  await Panel.hide()
  await PortsView.open()
}

export const run = async ({ PortsView }: TestContext): Promise<void> => {
  const portId = 3000
  // @ts-ignore
  await PortsView.forwardPort(portId)
  // @ts-ignore
  await PortsView.shouldHaveForwardedPort(portId)
}
