export const setup = async ({ Extensions, Editor }) => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
}

export const run = async ({ Extensions }) => {
  await Extensions.search('@builtin css')
  await Extensions.first.shouldBe('CSS Language Basics')
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
}
