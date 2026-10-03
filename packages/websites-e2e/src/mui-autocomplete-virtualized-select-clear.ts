import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url = 'https://mui.com/material-ui/react-autocomplete/'
const urlPattern = /^https:\/\/mui\.com\/material-ui\/react-autocomplete\/?$/

const expression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const isVisible = (element) => {
    if (!element) return false
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
  }
  const consent = Array.from(document.querySelectorAll('button')).find((button) => /^(essential only|allow analytics)$/i.test((button.textContent || '').trim()))
  consent?.click()
  const getInput = () => {
    const label = Array.from(document.querySelectorAll('label')).find((candidate) => (candidate.textContent || '').trim() === '10,000 options')
    return label?.htmlFor ? document.getElementById(label.htmlFor) : undefined
  }
  const getRoot = () => getInput()?.closest('.MuiAutocomplete-root')
  const waitFor = async (callback, message, timeout = 15000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const value = callback()
      if (value) return value
      await delay(100)
    }
    const input = getInput()
    throw new Error(\`\${message}. url=\${location.href}; input=\${input instanceof HTMLInputElement ? input.value : '<missing>'}; expanded=\${input?.getAttribute('aria-expanded')}\`)
  }
  const input = await waitFor(() => {
    const candidate = getInput()
    return candidate instanceof HTMLInputElement ? candidate : undefined
  }, 'Expected MUI 10,000-options input')
  const root = getRoot()
  const open = root?.querySelector('button[title="Open"], button[aria-label="Open"]')
  if (!(open instanceof HTMLElement)) {
    throw new Error('Expected MUI autocomplete open control')
  }
  input.scrollIntoView({ block: 'center' })
  open.click()
  const listbox = await waitFor(() => {
    const candidate = document.querySelector('[role="listbox"]')
    return candidate instanceof HTMLElement && isVisible(candidate) ? candidate : undefined
  }, 'Expected MUI virtualized listbox')
  const scrollContainer = listbox.querySelector('[role="list"]')
  if (!(scrollContainer instanceof HTMLElement) || scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
    throw new Error('Expected scrollable MUI virtualized options container')
  }
  scrollContainer.scrollTop = scrollContainer.scrollHeight
  await waitFor(() => scrollContainer.scrollTop > 0 && Array.from(document.querySelectorAll('[role="option"]')).some((option) => /^#(?:999\\d|10000) -/.test(option.textContent || '')), 'Expected MUI virtualized listbox to scroll down')
  scrollContainer.scrollTop = 0
  await waitFor(() => scrollContainer.scrollTop === 0 && Array.from(document.querySelectorAll('[role="option"]')).some((option) => (option.textContent || '').startsWith('#1 -')), 'Expected MUI virtualized listbox to return to the top')
  const option = await waitFor(() => {
    const rendered = Array.from(document.querySelectorAll('[role="option"]'))
    const target = rendered.find((candidate) => (candidate.textContent || '').startsWith('#123 -'))
    if (target) return target
    const indices = rendered.map((candidate) => Number((candidate.textContent || '').match(/^#(\\d+) -/)?.[1])).filter(Number.isFinite)
    const middle = indices[Math.floor(indices.length / 2)] || 1
    scrollContainer.scrollTop += (123 - middle) * 36
    return undefined
  }, 'Expected virtualized option #123')
  const selectedValue = (option.textContent || '').replace(/^#123 - /, '')
  option.click()
  await waitFor(() => input.value === selectedValue, 'Expected option #123 to be selected')
  const clear = await waitFor(() => {
    const candidate = getRoot()?.querySelector('button[title="Clear"], button[aria-label="Clear"]')
    return candidate instanceof HTMLElement ? candidate : undefined
  }, 'Expected MUI autocomplete clear control')
  clear.click()
  await waitFor(() => input.value === '', 'Expected MUI autocomplete value to be cleared')
  input.blur()
  await waitFor(() => !Array.from(document.querySelectorAll('[role="listbox"]')).some(isVisible), 'Expected MUI autocomplete listbox to close')
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({ url })
  await SimpleBrowser.shouldHaveText({ selector: 'h1', text: 'Autocomplete', timeout: 20_000, urlPattern })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({ expression, timeout: 30_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
