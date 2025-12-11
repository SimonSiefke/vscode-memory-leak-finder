import type { TestContext } from '../types.ts'

export const skip = 0

export const setup = async ({ PortsView }: TestContext): Promise<void> => {
  await PortsView.open()
}

export const run = async ({ PortsView }: TestContext): Promise<void> => {
  const port = 3007
  // @ts-ignore
  await using server = await PortsView.forwardPort(port)

  // @ts-ignore
  await PortsView.unforwardAllPorts(port)
}
