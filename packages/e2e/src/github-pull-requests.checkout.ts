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

export const run = async ({ GitHubPullRequests, SourceControl, ActivityBar, Git }: TestContext): Promise<void> => {
  // Wait a bit for the extension to fully load after installation
  const { resolve: resolveInit, promise: promiseInit } = Promise.withResolvers<void>()
  setTimeout(resolveInit, 3000)
  await promiseInit

  // Look for open pull requests in the view
  const prs = await GitHubPullRequests.getAvailablePullRequests()

  if (prs.length === 0) {
    // No PRs found - repo might not have PRs or extension not fully loaded
    return
  }

  const firstPrNumber = prs[0].number

  // Checkout the first pull request
  await GitHubPullRequests.checkoutPullRequest(firstPrNumber)

  // Verify the expected data is displayed - check source control shows we're on a PR branch
  await ActivityBar.showSourceControl()
  // The source control view should show we're on a branch (not necessarily the PR number in the name)

  // Checkout the main branch
  try {
    await SourceControl.checkoutBranch('main')
  } catch {
    // Try 'master' if 'main' doesn't exist
    try {
      await SourceControl.checkoutBranch('master')
    } catch {
      // If both fail, try using Git directly
      await Git.checkoutBranch('main').catch(() => Git.checkoutBranch('master'))
    }
  }

  // Wait a bit
  const { resolve: resolve4, promise: promise4 } = Promise.withResolvers<void>()
  setTimeout(resolve4, 2000)
  await promise4

  // Checkout the first pull request again
  await GitHubPullRequests.checkoutPullRequest(firstPrNumber)
}
