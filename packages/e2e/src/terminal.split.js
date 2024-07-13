export const skip = true

export const setup = async ({ Terminal, Panel }) => {
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal }) => {
  await Terminal.split()
  await Terminal.killSecond()
}
