export const skip = 1

export const run = async ({ PortsView }) => {
  await PortsView.open()
  await PortsView.close()
}
