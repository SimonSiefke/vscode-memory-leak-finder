import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const npmUrl = 'https://www.npmjs.com/'
const packageName = 'typescript'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: npmUrl,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const isVisible = (element) => {
    if (!element) {
      return false
    }
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
  }
  const waitForWindowLoad = async () => {
    if (document.readyState === 'complete') {
      return
    }
    await new Promise((resolve) => {
      window.addEventListener('load', resolve, { once: true })
    })
  }
  const waitForPageIdle = async () => {
    await new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(resolve, { timeout: 1500 })
      } else {
        setTimeout(resolve, 500)
      }
    })
    await delay(250)
  }
  const waitFor = async (callback, message, timeout = 20000) => {
    const start = Date.now()
    let lastValue
    while (Date.now() - start < timeout) {
      lastValue = callback()
      if (lastValue) {
        return lastValue
      }
      await delay(250)
    }
    throw new Error(message)
  }
  const getSearchInput = () => {
    return document.querySelector('input[type="search"], input[name="q"], input[placeholder*="Search" i], input[aria-label*="Search" i]')
  }
  const typeIntoInput = (input, value) => {
    input.focus()
    input.select()
    if (!document.execCommand('insertText', false, value) || input.value !== value) {
      throw new Error(\`Expected typed text "\${value}" in npm search input, got "\${input.value}"\`)
    }
  }
  const clearInput = (input) => {
    input.focus()
    input.select()
    if (!document.execCommand('delete', false)) {
      throw new Error('Expected npm search input text to be deleted')
    }
  }
  await waitForWindowLoad()
  await waitForPageIdle()
  const searchInput = await waitFor(() => {
    const input = getSearchInput()
    return input instanceof HTMLInputElement && isVisible(input) ? input : undefined
  }, 'Expected npm search input')
  typeIntoInput(searchInput, ${JSON.stringify(packageName)})
  const submitButton = document.querySelector('button[type="submit"], input[type="submit"], button[aria-label*="Search" i]')
  if (submitButton instanceof HTMLElement && isVisible(submitButton)) {
    submitButton.click()
  } else {
    throw new Error('Expected visible npm search button')
  }
  await waitForWindowLoad()
  await waitForPageIdle()
  await waitFor(() => {
    const bodyText = document.body.textContent || ''
    return /typescript/i.test(bodyText) && (/\\/search/.test(location.pathname) || /packages found|search results|sort packages/i.test(bodyText))
  }, 'Expected npm search results for typescript')
  const clearButton = document.querySelector('button[aria-label*="Clear" i], [role="button"][aria-label*="Clear" i]')
  if (clearButton instanceof HTMLElement && isVisible(clearButton)) {
    clearButton.click()
  } else {
    const activeInput = getSearchInput()
    if (!(activeInput instanceof HTMLInputElement)) {
      throw new Error('Expected npm search input after search')
    }
    clearInput(activeInput)
  }
  await waitForPageIdle()
  await waitFor(() => {
    const input = getSearchInput()
    return input instanceof HTMLInputElement && input.value === ''
  }, 'Expected npm search input to be empty after clearing')
})()`,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
