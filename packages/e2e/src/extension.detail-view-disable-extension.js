export const skip = 1

export const setup = async ({ Extensions, Editor, ExtensionDetailView }) => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html language features')
  await Extensions.first.shouldBe('HTML Language Features')
  await Extensions.first.click()
  await ExtensionDetailView.shouldHaveHeading('HTML Language Features')
  await ExtensionDetailView.shouldHaveTab('Details')
  await ExtensionDetailView.enableExtension({ force: true })
}

export const run = async ({ ExtensionDetailView }) => {
  await ExtensionDetailView.disableExtension()
  await ExtensionDetailView.enableExtension()
}
