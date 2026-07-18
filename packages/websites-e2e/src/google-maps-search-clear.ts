import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const mapsUrl = 'https://www.google.com/maps'
const basePlaceName = 'Alexanderplatz Berlin'
const basePlaceResultName = 'Alexanderplatz'
const alternatePlaceName = 'Potsdamer Platz Berlin'
const alternatePlaceResultName = 'Potsdamer Platz'
const mapsUrlPattern = /^https:\/\/www\.google\.com\/maps/

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

const getSearchPlaceExpression = (placeName: string, resultName: string): string => {
  return `(async () => {
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
  const waitFor = async (callback, message, timeout = 45000) => {
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
  const getSearchButton = () => {
    const buttons = Array.from(document.querySelectorAll('#searchbox-searchbutton, button[aria-label*="Search" i], button[aria-label*="Suche" i], button[aria-label*="Suchen" i], button[type="submit"], input[type="submit"]'))
    return buttons.find(isVisible)
  }
  const typeIntoInput = (input, value) => {
    input.focus()
    input.select()
    if (!document.execCommand('insertText', false, value) || input.value !== value) {
      throw new Error(\`Expected typed text "\${value}" in Google Maps search input, got "\${input.value}"\`)
    }
  }
  await waitForWindowLoad()
  await waitForPageIdle()
  const searchInput = await waitFor(() => {
    const input = getSearchInput()
    return input instanceof HTMLInputElement && isVisible(input) ? input : undefined
  }, 'Expected Google Maps search input')
  typeIntoInput(searchInput, ${JSON.stringify(placeName)})
  const searchButton = await waitFor(() => {
    const button = getSearchButton()
    return button instanceof HTMLElement ? button : undefined
  }, 'Expected Google Maps search button')
  searchButton.click()
  await waitForWindowLoad()
  await waitForPageIdle()
  await waitFor(() => {
    const bodyText = document.body.textContent || ''
    return bodyText.includes(${JSON.stringify(resultName)})
  }, ${JSON.stringify(`Expected Google Maps search results for ${placeName}`)})
})()`
}

const searchPlace = async (SimpleBrowser: TestContext['SimpleBrowser'], placeName: string, resultName: string): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: getSearchPlaceExpression(placeName, resultName),
    timeout: 55_000,
  })
  await SimpleBrowser.shouldHaveText({
    text: resultName,
    timeout: 45_000,
    urlPattern: mapsUrlPattern,
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
  await searchPlace(SimpleBrowser, basePlaceName, basePlaceResultName)
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await searchPlace(SimpleBrowser, alternatePlaceName, alternatePlaceResultName)
  await searchPlace(SimpleBrowser, basePlaceName, basePlaceResultName)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
