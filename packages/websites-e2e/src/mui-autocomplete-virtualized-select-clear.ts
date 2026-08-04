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
    throw new Error(\`${message}. url=\${location.href}; input=\${input instanceof HTMLInputElement ? input.value : '<missing>'}; expanded=\${input?.getAttribute('aria-expanded')}\`)
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
  listbox.scrollTop = listbox.scrollHeight
  await waitFor(() => listbox.scrollTop > 0, 'Expected MUI virtualized listbox to scroll down')
  listbox.scrollTop = 0
  await waitFor(() => listbox.scrollTop === 0, 'Expected MUI virtualized listbox to return to the top')
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!setter) throw new Error('Expected native input value setter')
  setter.call(input, '#123')
  input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '#123', inputType: 'insertText' }))
  const option = await waitFor(() => {
    return Array.from(document.querySelectorAll('[role="option"]')).find((candidate) => (candidate.textContent || '').startsWith('#123 -'))
  }, 'Expected virtualized option #123')
  option.click()
  await waitFor(() => input.value.startsWith('#123 -'), 'Expected option #123 to be selected')
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
