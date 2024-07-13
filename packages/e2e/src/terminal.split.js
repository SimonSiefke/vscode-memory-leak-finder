export const skip = process.platform === 'win32'

export const setup = async ({ Terminal, Panel }) => {
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal }) => {
  await Terminal.split()
  await Terminal.killSecond()
}
