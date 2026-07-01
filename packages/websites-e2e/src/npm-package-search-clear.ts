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
  const searchInput = await waitFor(() => {
    const input = getSearchInput()
    return input instanceof HTMLInputElement && isVisible(input) ? input : undefined
  }, 'Expected npm search input')
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!valueSetter) {
    throw new Error('Expected input value setter')
  }
  searchInput.focus()
  valueSetter.call(searchInput, ${JSON.stringify(packageName)})
  searchInput.dispatchEvent(new InputEvent('input', { bubbles: true, data: ${JSON.stringify(packageName)}, inputType: 'insertText' }))
  searchInput.dispatchEvent(new Event('change', { bubbles: true }))
  const submitButton = document.querySelector('button[type="submit"], input[type="submit"], button[aria-label*="Search" i]')
  if (submitButton instanceof HTMLElement && isVisible(submitButton)) {
    submitButton.click()
  } else if (searchInput.form) {
    searchInput.form.requestSubmit()
  } else {
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter' }))
    searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter' }))
  }
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
    activeInput.focus()
    valueSetter.call(activeInput, '')
    activeInput.dispatchEvent(new InputEvent('input', { bubbles: true, data: null, inputType: 'deleteContentBackward' }))
    activeInput.dispatchEvent(new Event('change', { bubbles: true }))
  }
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
