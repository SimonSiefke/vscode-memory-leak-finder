import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const homesUrl = 'https://www.airbnb.com/homes'
const allUrlPattern = /^https:\/\/www\.airbnb\.com\/?$/
const homesUrlPattern = /^https:\/\/www\.airbnb\.com\/homes\/?$/
const allTabSelector = 'a[role="tab"][href="/"]'
const homesTabSelector = 'a[role="tab"][href="/homes"]'

const dismissConsentExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const isVisible = (element) => {
    if (!element) {
      return false
    }
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
  }
  const getButtonText = (button) => {
    return [
      button.textContent || '',
      button.getAttribute('aria-label') || '',
      button.getAttribute('value') || '',
    ].join(' ').replace(/\\s+/g, ' ').trim()
  }
  const consentPatterns = [
    /^only necessary$/i,
    /^essential only$/i,
    /^reject all$/i,
    /^decline all$/i,
    /^nur notwendige$/i,
    /^nur erforderliche$/i,
    /^alle ablehnen$/i,
  ]
  const getConsentButton = () => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
    return buttons.find((button) => {
      return isVisible(button) && consentPatterns.some((pattern) => pattern.test(getButtonText(button)))
    })
  }
  const getSelectedHomesTab = () => {
    const tab = document.querySelector(${JSON.stringify(`${homesTabSelector}[aria-selected="true"]`)})
    return tab instanceof HTMLElement && isVisible(tab) ? tab : undefined
  }
  const start = Date.now()
  let clickedConsent = false
  while (Date.now() - start < 20000) {
    const consentButton = getConsentButton()
    if (consentButton && !clickedConsent) {
      consentButton.click()
      clickedConsent = true
      await delay(250)
      continue
    }
    if (!consentButton && getSelectedHomesTab()) {
      return
    }
    await delay(250)
  }
  const visibleButtons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
    .filter(isVisible)
    .map(getButtonText)
    .filter(Boolean)
    .slice(0, 12)
    .join(' | ')
  throw new Error(\`Expected Airbnb Homes tab after dismissing consent. url=\${location.href}; buttons=\${visibleButtons || '<none>'}\`)
})()`

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: homesUrl,
  })
  await SimpleBrowser.executeJavaScript({
    expression: dismissConsentExpression,
    timeout: 25_000,
  })
  await SimpleBrowser.shouldHaveText({
    selector: `${homesTabSelector}[aria-selected="true"]`,
    text: 'Homes',
    urlPattern: homesUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    selector: allTabSelector,
    urlPattern: allUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: `${allTabSelector}[aria-selected="true"]`,
    text: 'All',
    urlPattern: allUrlPattern,
  })
  await SimpleBrowser.clickPageLink({
    selector: homesTabSelector,
    urlPattern: homesUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: `${homesTabSelector}[aria-selected="true"]`,
    text: 'Homes',
    urlPattern: homesUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
