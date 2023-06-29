export const setup = async ({ Extensions }) => {
  await Extensions.show()
  await Extensions.search('@builtin html ')
  await Extensions.first.shouldBe('HTML Language Basics')
}

export const run = async ({ Extensions }) => {
  await Extensions.show()
  await Extensions.hide()
}
