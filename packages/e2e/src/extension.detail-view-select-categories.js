export const setup = async ({ Extensions, Editor, ExtensionDetailView }) => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
  await Extensions.first.click()
  await ExtensionDetailView.shouldHaveHeading('HTML Language Basics')
  await ExtensionDetailView.shouldHaveTab('Details')
}

export const run = async ({ ExtensionDetailView, Extensions }) => {
  await ExtensionDetailView.selectCategory('Programming Languages')
  await Extensions.shouldHaveValue('@category:"Programming Languages"')
  await Extensions.clear()
}
