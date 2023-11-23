export const setup = async ({ Extensions, Editor }) => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
}

export const run = async ({ Extensions, Editor, ExtensionDetailView }) => {
  await Extensions.first.click()
  await ExtensionDetailView.shouldHaveHeading('HTML Language Basics')
  await Editor.closeAll()
}
