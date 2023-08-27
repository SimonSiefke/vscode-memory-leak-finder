export const skip = true

export const setup = async ({ writeSettings }) => {
  await writeSettings({
    'window.titleBarStyle': 'custom',
  })
}

export const run = async ({ StatusBar }) => {
  const problems = await StatusBar.item('status.problems')
  await problems.hide()
  await problems.show()
}
