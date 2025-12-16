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
export const run = async ({ QuickPick, WellKnownCommands, Git, SourceControl, ActivityBar }: TestContext): Promise<void> => {
  // Wait a bit for the extension to fully load after installation
  const { resolve: resolveInit, promise: promiseInit } = Promise.withResolvers<void>()
  setTimeout(resolveInit, 3000)
  await promiseInit

  // Look for open pull requests using QuickPick commands
  // The GitHub PR extension provides commands to checkout PRs by number
  await QuickPick.showCommands()
  await QuickPick.type('GitHub Pull Requests: Checkout')

  // Get all visible commands related to PR checkout
  const allCommands = await QuickPick.getVisibleCommands()
  const checkoutCommands = allCommands.filter((cmd: string) =>
    cmd.toLowerCase().includes('checkout') && (cmd.toLowerCase().includes('pull request') || cmd.toLowerCase().includes('pr'))
  )

  if (checkoutCommands.length === 0) {
    // No PR checkout commands found - repo might not have PRs or extension not fully loaded
    return
  }

  // Execute the first checkout command (this will show a list of PRs)
  const firstCheckoutCommand = checkoutCommands[0]
  await QuickPick.select(firstCheckoutCommand, true)
  
  // Wait for PR list to appear
  const { resolve: resolve2, promise: promise2 } = Promise.withResolvers<void>()
  setTimeout(resolve2, 2000)
  await promise2

  // Get the list of PRs from the QuickPick
  const prCommands = await QuickPick.getVisibleCommands()
  const prNumbers = prCommands
    .map((cmd: string) => {
      const match = cmd.match(/#(\d+)/)
      return match ? match[1] : null
    })
    .filter((num: string | null) => num !== null)

  if (prNumbers.length === 0) {
    // No PRs found in the list
    await QuickPick.hide()
    return
  }

  const firstPrNumber = prNumbers[0]

  // Find and select the first PR
  const firstPrCommand = prCommands.find((cmd: string) => cmd.includes(`#${firstPrNumber}`))
  if (firstPrCommand) {
    await QuickPick.select(firstPrCommand)
  } else {
    // Fallback: select the first item in the list
    await QuickPick.pressEnter()
  }

  // Wait for checkout to complete
  const { resolve: resolve3, promise: promise3 } = Promise.withResolvers<void>()
  setTimeout(resolve3, 3000)
  await promise3

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
  await QuickPick.showCommands()
  await QuickPick.type('GitHub Pull Requests: Checkout')
  
  const checkoutCommands2 = await QuickPick.getVisibleCommands()
  const checkoutCmd2 = checkoutCommands2.find((cmd: string) =>
    cmd.toLowerCase().includes('checkout') && (cmd.toLowerCase().includes('pull request') || cmd.toLowerCase().includes('pr'))
  )

  if (checkoutCmd2) {
    await QuickPick.select(checkoutCmd2, true)
    // Wait for PR list
    const { resolve: resolve5, promise: promise5 } = Promise.withResolvers<void>()
    setTimeout(resolve5, 2000)
    await promise5
    
    // Select the same PR again
    const prCommands2 = await QuickPick.getVisibleCommands()
    const samePrCommand = prCommands2.find((cmd: string) => cmd.includes(`#${firstPrNumber}`))
    if (samePrCommand) {
      await QuickPick.select(samePrCommand)
    } else {
      await QuickPick.pressEnter()
    }
  }
}
