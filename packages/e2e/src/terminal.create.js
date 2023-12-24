export const skip = true

export const setup = async ({ Terminal }) => {
  await Terminal.killAll()
}

export const run = async ({ Terminal }) => {
  await Terminal.show()
  await Terminal.add()
}
