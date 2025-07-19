export const skip = true

export const setup = async ({ Extensions, Editor }) => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html language features')
  await Extensions.first.shouldBe('HTML Language Features')
}

export const run = async ({ Extensions, Editor, ExtensionDetailView }) => {
  await Extensions.first.click()
  await ExtensionDetailView.shouldHaveHeading('HTML Language Features')
  await ExtensionDetailView.shouldHaveTab('Details')
  await ExtensionDetailView.openTab('Features', { webView: false })
  await ExtensionDetailView.openFeature('Settings')
  await ExtensionDetailView.shouldHaveFeatureHeading('Settings')
  await Editor.closeAll()
}
