import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const mapsUrl = 'https://www.google.com/maps'
const basePlaceName = 'Brandenburg Gate Berlin'
const alternatePlaceName = 'Alexanderplatz Berlin'

const consentExpression = `(async () => {
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
})()`

const getSubmitSearchExpression = (placeName: string): string => {
  return `(async () => {
  const placeName = ${JSON.stringify(placeName)}
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
    throw new Error(\`\${message}. url=\${location.href}; consentPage=\${isConsentPage()}; buttons=\${getVisibleButtonTexts() || '<none>'}\`)
  }
  const getSearchInput = () => {
    return document.querySelector('#searchboxinput, input[aria-label*="Search" i], input[aria-label*="Suche" i], input[aria-label*="Suchen" i], input[name="q"], input[type="search"]')
  }
  const searchInput = await waitFor(() => {
    const input = getSearchInput()
    return input instanceof HTMLInputElement && isVisible(input) ? input : undefined
  }, \`Expected Google Maps search input for \${placeName}\`)
  searchInput.focus()
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!valueSetter) {
    throw new Error('Expected input value setter')
  }
  valueSetter.call(searchInput, placeName)
  searchInput.dispatchEvent(new InputEvent('input', { bubbles: true, data: placeName, inputType: 'insertText' }))
  searchInput.dispatchEvent(new Event('change', { bubbles: true }))
  const searchButton = document.querySelector('#searchbox-searchbutton, button[aria-label*="Search" i], button[aria-label*="Suche" i], button[aria-label*="Suchen" i], [role="button"][aria-label*="Search" i], [role="button"][aria-label*="Suche" i], [role="button"][aria-label*="Suchen" i]')
  if (searchButton instanceof HTMLElement && isVisible(searchButton)) {
    searchButton.click()
  } else {
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter' }))
    searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter' }))
  }
})()`
}

const getWaitForSearchResultExpression = (placeName: string): string => {
  return `(async () => {
  const placeName = ${JSON.stringify(placeName)}
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const waitFor = async (callback, message, timeout = 30000) => {
    const start = Date.now()
    let lastValue
    while (Date.now() - start < timeout) {
      lastValue = callback()
      if (lastValue) {
        return lastValue
      }
      await delay(250)
    }
    throw new Error(\`\${message}. url=\${location.href}\`)
  }
  await waitFor(() => {
    const bodyText = document.body.textContent || ''
    const expectedName = placeName.replace(/ Berlin$/i, '')
    return new RegExp(expectedName, 'i').test(bodyText) || /\\/maps\\/(place|search)\\//.test(location.href)
  }, \`Expected Google Maps search result for \${placeName}\`, 30000)
})()`
}

const searchPlace = async (SimpleBrowser: TestContext['SimpleBrowser'], placeName: string): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: getSubmitSearchExpression(placeName),
    timeout: 25_000,
  })
  await SimpleBrowser.executeJavaScript({
    expression: getWaitForSearchResultExpression(placeName),
    timeout: 35_000,
  })
}

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: mapsUrl,
  })
  await SimpleBrowser.executeJavaScript({
    expression: consentExpression,
    timeout: 35_000,
  })
  await searchPlace(SimpleBrowser, basePlaceName)
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await searchPlace(SimpleBrowser, alternatePlaceName)
  await searchPlace(SimpleBrowser, basePlaceName)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
