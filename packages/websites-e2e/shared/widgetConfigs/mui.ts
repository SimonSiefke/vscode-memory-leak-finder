import type { ReversibleWidgetConfig } from '../reversibleWidget.ts'

const materialUrl = (component: string): string => `https://mui.com/material-ui/react-${component}/`

export const muiWidgetConfigs = {
  'mui-accordion-toggle-restore': {
    name: 'mui-accordion-toggle-restore',
    url: materialUrl('accordion'),
    ready: `await waitFor(() => findByText('button[aria-expanded]', 'Accordion 1'), 'Expected MUI accordion')`,
    run: `
      const button = findByText('button[aria-expanded]', 'Accordion 1')
      assert(button instanceof HTMLElement && button.getAttribute('aria-expanded') === 'false', 'Expected collapsed MUI accordion')
      button.click()
      await waitFor(() => button.getAttribute('aria-expanded') === 'true', 'Expected expanded MUI accordion')
      button.click()
      await waitFor(() => button.getAttribute('aria-expanded') === 'false', 'Expected restored MUI accordion')`,
  },
  'mui-dialog-open-close': {
    name: 'mui-dialog-open-close',
    url: materialUrl('dialog'),
    ready: `await waitFor(() => findByText('button', 'Open alert dialog'), 'Expected MUI dialog trigger')`,
    run: `
      clickByText('button', 'Open alert dialog')
      await waitFor(() => document.querySelector('[role="dialog"]'), 'Expected open MUI dialog')
      const dialog = document.querySelector('[role="dialog"]')
      const close = Array.from(dialog.querySelectorAll('button')).find((button) => /^(cancel|disagree|close)$/i.test((button.textContent || '').trim()))
      assert(close instanceof HTMLElement, 'Expected dialog cancel control')
      await clickUntil(close, () => !document.querySelector('[role="dialog"]'), 'Expected closed MUI dialog')`,
  },
  'mui-drawer-open-close': {
    name: 'mui-drawer-open-close',
    url: materialUrl('drawer'),
    ready: `await waitFor(() => findByText('button', 'Open drawer'), 'Expected MUI drawer trigger')`,
    run: `
      clickByText('button', 'Open drawer')
      const isVisible = (element) => element instanceof HTMLElement && getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).display !== 'none' && Number(getComputedStyle(element).opacity) > 0
      const getVisibleBackdrop = () => Array.from(document.querySelectorAll('.MuiDrawer-root .MuiBackdrop-root')).find(isVisible)
      const backdrop = await waitFor(getVisibleBackdrop, 'Expected open MUI drawer')
      await clickUntil(backdrop, () => !getVisibleBackdrop(), 'Expected closed MUI drawer')`,
  },
  'mui-menu-open-close': {
    name: 'mui-menu-open-close',
    url: materialUrl('menu'),
    ready: `await waitFor(() => findByText('button', 'Dashboard'), 'Expected MUI menu trigger')`,
    run: `
      clickByText('button', 'Dashboard')
      const menu = await waitFor(() => document.querySelector('[role="menu"]'), 'Expected open MUI menu')
      const item = menu.querySelector('[role="menuitem"]')
      assert(item instanceof HTMLElement, 'Expected MUI menu item')
      await clickUntil(item, () => !document.querySelector('[role="menu"]'), 'Expected closed MUI menu')`,
  },
  'mui-rating-select-restore': {
    name: 'mui-rating-select-restore',
    url: materialUrl('rating'),
    ready: `await waitFor(() => document.querySelector('.MuiRating-root input[type="radio"]:checked'), 'Expected MUI rating')`,
    run: `
      const group = document.querySelector('.MuiRating-root')
      const initial = group?.querySelector('input[type="radio"]:checked')
      const four = group?.querySelector('input[type="radio"][value="4"]')
      assert(initial instanceof HTMLInputElement && four instanceof HTMLInputElement, 'Expected rating options')
      const initialValue = initial.value
      four.click()
      await waitFor(() => four.checked, 'Expected four-star rating')
      const restore = group.querySelector(\`input[type="radio"][value="\${initialValue}"]\`)
      assert(restore instanceof HTMLInputElement, 'Expected initial rating option')
      restore.click()
      await waitFor(() => restore.checked, 'Expected restored rating')`,
  },
  'mui-select-select-restore': {
    name: 'mui-select-select-restore',
    url: materialUrl('select'),
    ready: `await waitFor(() => document.querySelector('select.MuiNativeSelect-select'), 'Expected MUI native select')`,
    run: `
      const select = document.querySelector('select.MuiNativeSelect-select')
      assert(select instanceof HTMLSelectElement, 'Expected MUI native select')
      const initial = select.value
      const alternative = Array.from(select.options).find((option) => option.value && option.value !== initial)
      assert(alternative, 'Expected alternative select option')
      select.value = alternative.value
      select.dispatchEvent(new Event('change', { bubbles: true }))
      await waitFor(() => select.value === alternative.value, 'Expected changed MUI select')
      select.value = initial
      select.dispatchEvent(new Event('change', { bubbles: true }))
      await waitFor(() => select.value === initial, 'Expected restored MUI select')`,
  },
  'mui-slider-step-restore': {
    name: 'mui-slider-step-restore',
    url: materialUrl('slider'),
    ready: `await waitFor(() => document.querySelector('input[type="range"][aria-label="Volume"]'), 'Expected MUI slider')`,
    run: `
      const input = document.querySelector('input[type="range"][aria-label="Volume"]')
      assert(input instanceof HTMLInputElement, 'Expected volume slider')
      const initial = input.value
      input.focus()
      input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }))
      await waitFor(() => input.value !== initial, 'Expected incremented MUI slider')
      input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowLeft' }))
      await waitFor(() => input.value === initial, 'Expected restored MUI slider')`,
  },
  'mui-switch-toggle-restore': {
    name: 'mui-switch-toggle-restore',
    url: materialUrl('switch'),
    ready: `await waitFor(() => document.querySelector('.MuiSwitch-root input[type="checkbox"]'), 'Expected MUI switch')`,
    run: `
      const input = document.querySelector('.MuiSwitch-root input[type="checkbox"]')
      assert(input instanceof HTMLInputElement, 'Expected MUI switch input')
      const initial = input.checked
      input.click()
      await waitFor(() => input.checked !== initial, 'Expected toggled MUI switch')
      input.click()
      await waitFor(() => input.checked === initial, 'Expected restored MUI switch')`,
  },
  'mui-tabs-switch-restore': {
    name: 'mui-tabs-switch-restore',
    url: materialUrl('tabs'),
    ready: `await waitFor(() => findByText('[role="tab"]', 'Item Two'), 'Expected MUI tabs')`,
    run: `
      const first = findByText('[role="tab"]', 'Item One')
      const second = findByText('[role="tab"]', 'Item Two')
      assert(first instanceof HTMLElement && second instanceof HTMLElement, 'Expected MUI tab controls')
      second.click()
      await waitFor(() => second.getAttribute('aria-selected') === 'true', 'Expected second MUI tab')
      first.click()
      await waitFor(() => first.getAttribute('aria-selected') === 'true', 'Expected restored first MUI tab')`,
  },
  'mui-tooltip-open-close': {
    name: 'mui-tooltip-open-close',
    url: materialUrl('tooltip'),
    ready: `await waitFor(() => document.querySelector('button[aria-label="Delete"]'), 'Expected MUI tooltip trigger')`,
    run: `
      const button = document.querySelector('button[aria-label="Delete"]')
      assert(button instanceof HTMLElement, 'Expected Delete tooltip button')
      button.focus()
      await waitFor(() => document.querySelector('[role="tooltip"]'), 'Expected visible MUI tooltip')
      button.blur()
      await waitFor(() => !document.querySelector('[role="tooltip"]'), 'Expected removed MUI tooltip')`,
  },
} satisfies Record<string, ReversibleWidgetConfig>
