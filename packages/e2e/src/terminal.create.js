export const skip = process.platform === 'win32'

export const setup = async ({ Terminal, Panel }) => {
  await Panel.close()
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal }) => {
  await Terminal.add()
  await Terminal.killSecond()
}
