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

const getNavigateToSearchExpression = (placeName: string): string => {
  return `(async () => {
  const url = ${JSON.stringify(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`)}
  setTimeout(() => {
    location.href = url
  }, 100)
})()`
}

const waitExpression = `(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
})()`

const searchPlace = async (SimpleBrowser: TestContext['SimpleBrowser'], placeName: string, resultName: string): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: getNavigateToSearchExpression(placeName),
    timeout: 5_000,
  })
  await SimpleBrowser.shouldHaveText({
    text: resultName,
    timeout: 45_000,
    urlPattern: mapsUrlPattern,
  })
  await SimpleBrowser.executeJavaScript({
    expression: waitExpression,
    timeout: 5_000,
  })
  await SimpleBrowser.shouldHaveText({
    text: resultName,
    timeout: 10_000,
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
