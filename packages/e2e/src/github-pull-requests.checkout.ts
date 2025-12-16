import type { TestContext } from '../types.ts'

export const setup = async ({ Extensions, Editor, ExtensionDetailView, Git }: TestContext): Promise<void> => {
  await Editor.closeAll()

  // Open extensions view
  await Extensions.show()

  // Search for GitHub Pull Requests extension
  await Extensions.search('github pull requests')

  // Wait a bit for search results to load
  const { resolve, promise } = Promise.withResolvers<void>()
  setTimeout(resolve, 2000)
  await promise

  // Click on the first extension result (should be GitHub Pull Requests extension)
  await Extensions.first.click()

  // Install the extension
  await ExtensionDetailView.installExtension()

  // Close the extension detail view
  await Editor.closeAll()

  // Clone a repository (choose a smaller repository with pull requests)
  // Using a smaller popular repository that likely has open PRs
  await Git.cloneRepository('https://github.com/octocat/Hello-World.git')
}

// @ts-ignore
export const run = async ({ QuickPick, WellKnownCommands }: TestContext): Promise<void> => {
  // Use QuickPick to checkout a pull request
  // The GitHub Pull Requests extension typically provides commands like "GitHub Pull Requests: Checkout Pull Request"
  await QuickPick.showCommands()
  await QuickPick.executeCommand(WellKnownCommands.FocusOnPullRequestsView)

  // TODO look for open pull requests in the view
  // TODO checkout the first pull request
  // TODO verify the exepected data is displayed
  // TODO checkout the main branch
  // TODO checkout the first pull request again

  // Look for checkout command first
}
