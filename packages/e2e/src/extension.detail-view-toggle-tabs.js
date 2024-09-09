export const setup = async ({ Extensions, Editor, ExtensionDetailView }) => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
  await Extensions.first.click()
  await ExtensionDetailView.shouldHaveHeading('HTML Language Basics')
}

export const run = async ({ ExtensionDetailView }) => {
  await ExtensionDetailView.shouldHaveTab('Details')
  await ExtensionDetailView.openTab('Features', { webView: false })
  await ExtensionDetailView.openTab('Changelog', { webView: true })
  await ExtensionDetailView.openTab('Details', { webView: true })
}
