export const skip = 1

export const setup = async ({ Panel, PortsView }) => {
  await Panel.hide()
  await PortsView.open()
}

export const run = async ({ PortsView }) => {
  await PortsView.setPortInput(1234)
  await PortsView.cancelPortEdit(1234)
}
