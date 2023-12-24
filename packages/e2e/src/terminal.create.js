export const setup = async ({ Terminal, Panel }) => {
  await Panel.hide()
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal }) => {
  await Terminal.add()
  await Terminal.killSecond()
}
