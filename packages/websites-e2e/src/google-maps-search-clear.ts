import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const mapsUrl = 'https://www.google.com/maps'
const placeName = 'Brandenburg Gate Berlin'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: mapsUrl,
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
  const getElementText = (element) => {
    return [
      element.textContent || '',
      element.getAttribute('aria-label') || '',
      element.getAttribute('value') || '',
    ].join(' ').replace(/\\s+/g, ' ').trim()
  }
  const findButtonByText = (patterns) => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
    return buttons.find((button) => {
      const text = getElementText(button)
      return patterns.some((pattern) => pattern.test(text))
    })
  }
  const getVisibleButtonTexts = () => {
    return Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
      .filter(isVisible)
      .map(getElementText)
      .filter(Boolean)
      .slice(0, 12)
      .join(' | ')
  }
  const isConsentPage = () => {
    const bodyText = document.body.textContent || ''
    return /consent\\.google\\./i.test(location.hostname) || /before you continue to google|bevor sie zu google weitergehen/i.test(bodyText)
  }
  const hasSearchInput = () => {
    const input = document.querySelector('#searchboxinput, input[aria-label*="Search" i], input[aria-label*="Suche" i], input[aria-label*="Suchen" i], input[name="q"], input[type="search"]')
    return input instanceof HTMLInputElement && isVisible(input)
  }
  const waitFor = async (callback, timeout = 30000) => {
    const start = Date.now()
    let lastValue
    while (Date.now() - start < timeout) {
      lastValue = callback()
      if (lastValue) {
        return lastValue
      }
      await delay(250)
    }
    return undefined
  }
  const consentButton = await waitFor(() => {
    if (hasSearchInput()) {
      return 'ready'
    }
    if (isConsentPage()) {
      window.scrollTo(0, document.body.scrollHeight)
    }
    return (
      findButtonByText([/reject all/i, /decline all/i, /alle ablehnen/i]) ||
      findButtonByText([/accept all/i, /allow all/i, /i agree/i, /^agree$/i, /alle akzeptieren/i, /zustimmen/i, /ich stimme zu/i])
    )
  })
  if (consentButton === 'ready') {
    return
  }
  if (consentButton && isVisible(consentButton)) {
    consentButton.click()
    return
  }
  throw new Error(\`Expected Google consent button or Maps search input. url=\${location.href}; consentPage=\${isConsentPage()}; buttons=\${getVisibleButtonTexts() || '<none>'}\`)
})()`,
    timeout: 35_000,
  })

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
  const getElementText = (element) => {
    return [
      element.textContent || '',
      element.getAttribute('aria-label') || '',
      element.getAttribute('value') || '',
    ].join(' ').replace(/\\s+/g, ' ').trim()
  }
  const getVisibleButtonTexts = () => {
    return Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
      .filter(isVisible)
      .map(getElementText)
      .filter(Boolean)
      .slice(0, 12)
      .join(' | ')
  }
  const isConsentPage = () => {
    const bodyText = document.body.textContent || ''
    return /consent\\.google\\./i.test(location.hostname) || /before you continue to google|bevor sie zu google weitergehen/i.test(bodyText)
  }
  const waitFor = async (callback, message, timeout = 7500) => {
    const start = Date.now()
    let lastValue
    while (Date.now() - start < timeout) {
      lastValue = callback()
      if (lastValue) {
        return lastValue
      }
      await delay(250)
    }
    throw new Error(\`\${message}. url=\${location.href}; consentPage=\${isConsentPage()}; buttons=\${getVisibleButtonTexts() || '<none>'}\`)
  }
  const getSearchInput = () => {
    return document.querySelector('#searchboxinput, input[aria-label*="Search" i], input[aria-label*="Suche" i], input[aria-label*="Suchen" i], input[name="q"], input[type="search"]')
  }
  const searchInput = await waitFor(() => {
    const input = getSearchInput()
    return input instanceof HTMLInputElement && isVisible(input) ? input : undefined
  }, 'Expected Google Maps search input', 20000)
  searchInput.focus()
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!valueSetter) {
    throw new Error('Expected input value setter')
  }
  valueSetter.call(searchInput, ${JSON.stringify(placeName)})
  searchInput.dispatchEvent(new InputEvent('input', { bubbles: true, data: ${JSON.stringify(placeName)}, inputType: 'insertText' }))
  searchInput.dispatchEvent(new Event('change', { bubbles: true }))
  const searchButton = document.querySelector('#searchbox-searchbutton, button[aria-label*="Search" i], button[aria-label*="Suche" i], button[aria-label*="Suchen" i], [role="button"][aria-label*="Search" i], [role="button"][aria-label*="Suche" i], [role="button"][aria-label*="Suchen" i]')
  if (searchButton instanceof HTMLElement && isVisible(searchButton)) {
    searchButton.click()
  } else {
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter' }))
    searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter' }))
  }
})()`,
    timeout: 25_000,
  })

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
  const findButtonByText = (patterns) => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
    return buttons.find((button) => {
      const text = [
        button.textContent || '',
        button.getAttribute('aria-label') || '',
        button.getAttribute('value') || '',
      ].join(' ')
      return patterns.some((pattern) => pattern.test(text))
    })
  }
  const waitFor = async (callback, message, timeout = 7500) => {
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
    return document.querySelector('#searchboxinput, input[aria-label*="Search" i], input[aria-label*="Suche" i], input[aria-label*="Suchen" i], input[name="q"], input[type="search"]')
  }
  await waitFor(() => {
    const bodyText = document.body.textContent || ''
    return /Brandenburg Gate/i.test(bodyText) || /\\/maps\\/(place|search)\\//.test(location.href)
  }, 'Expected Google Maps search result for Brandenburg Gate', 30000)
  const searchInput = await waitFor(() => {
    const input = getSearchInput()
    return input instanceof HTMLInputElement && isVisible(input) ? input : undefined
  }, 'Expected Google Maps search input after searching', 20000)
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!valueSetter) {
    throw new Error('Expected input value setter')
  }
  const clearButton =
    document.querySelector('button[aria-label*="Clear search" i], button[aria-label*="Clear" i], button[aria-label*="Suche löschen" i], [role="button"][aria-label*="Clear" i], [role="button"][aria-label*="Suche löschen" i]') ||
    findButtonByText([/clear search/i, /^clear$/i, /suche löschen/i])
  if (clearButton instanceof HTMLElement && isVisible(clearButton)) {
    clearButton.click()
  } else {
    searchInput.focus()
    valueSetter.call(searchInput, '')
    searchInput.dispatchEvent(new InputEvent('input', { bubbles: true, data: null, inputType: 'deleteContentBackward' }))
    searchInput.dispatchEvent(new Event('change', { bubbles: true }))
  }
  await waitFor(() => {
    const input = getSearchInput()
    return input instanceof HTMLInputElement && input.value === ''
  }, 'Expected Google Maps search input to be empty after clearing', 20000)
})()`,
    timeout: 35_000,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
