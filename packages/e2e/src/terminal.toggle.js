export const skip = true

export const setup = async ({ Terminal, Panel }) => {
  await Panel.hide()
  await Terminal.killAll()
}

export const run = async ({ Terminal }) => {
  await Terminal.show()
  await Terminal.killFirst()
}
