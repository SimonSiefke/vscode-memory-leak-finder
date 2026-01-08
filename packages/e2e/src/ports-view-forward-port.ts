import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Panel, PortsView }: TestContext): Promise<void> => {
  await Panel.hide()
  await Panel.show()
  await PortsView.open()
}

export const run = async ({ PortsView }: TestContext): Promise<void> => {
  const port = 3008

  // @ts-ignore
  await using server = await PortsView.forwardPort(port)

  await PortsView.unforwardAllPorts(port)
}
