import type { TestContext } from '../types.ts'

export const skip = 0

export const setup = async ({ PortsView, Panel }: TestContext): Promise<void> => {
  await Panel.hide()
  await Panel.show()
  await PortsView.open()
}

export const run = async ({ PortsView }: TestContext): Promise<void> => {
  const port = 3008
  // @ts-ignore
  await using server = await PortsView.forwardPort(port)

  // @ts-ignore
  await PortsView.unforwardAllPorts(port)
}
