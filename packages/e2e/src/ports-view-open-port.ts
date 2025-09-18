import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Panel, PortsView }: TestContext): Promise<void> => {
  await Panel.hide()
  await PortsView.open()
}

export const run = async ({ PortsView }: TestContext): Promise<void> => {
  await PortsView.setPortInput(1234)
  await PortsView.cancelPortEdit(1234)
}
