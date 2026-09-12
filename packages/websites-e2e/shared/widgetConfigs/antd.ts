import type { ReversibleWidgetConfig } from '../reversibleWidget.ts'

const antdUrl = (component: string): string => `https://ant.design/components/${component}`

export const antdWidgetConfigs = {
  'antd-checkbox-toggle-restore': {
    name: 'antd-checkbox-toggle-restore',
    url: antdUrl('checkbox'),
    ready: `
      await waitFor(() => isReactReady(document.querySelector('.ant-checkbox-input')), 'Expected hydrated Ant Design checkbox')
      await waitFor(() => {
        const demoActions = Array.from(document.querySelectorAll('.code-box-code-action'))
        return demoActions.length > 0 && demoActions.every(isReactReady)
      }, 'Expected hydrated Ant Design demo actions', 30000)
      await waitForStableReact()`,
    run: `
      const input = document.querySelector('.ant-checkbox-input')
      assert(input instanceof HTMLInputElement, 'Expected Ant Design checkbox input')
      const initial = input.checked
      input.click()
      await waitFor(() => input.checked !== initial, 'Expected toggled Ant Design checkbox')
      input.click()
      await waitFor(() => input.checked === initial, 'Expected restored Ant Design checkbox')`,
  },
  'antd-collapse-toggle-restore': {
    name: 'antd-collapse-toggle-restore',
    url: antdUrl('collapse'),
    ready: `await waitFor(() => isReactReady(document.querySelector('.ant-collapse-header')), 'Expected hydrated Ant Design collapse')`,
    run: `
      const header = document.querySelector('.ant-collapse-header')
      assert(header instanceof HTMLElement, 'Expected Ant Design collapse header')
      const initial = header.getAttribute('aria-expanded')
      header.click()
      await waitFor(() => header.getAttribute('aria-expanded') !== initial, 'Expected toggled collapse panel')
      header.click()
      await waitFor(() => header.getAttribute('aria-expanded') === initial, 'Expected restored collapse panel')`,
  },
  'antd-color-picker-open-close': {
    name: 'antd-color-picker-open-close',
    url: antdUrl('color-picker'),
    ready: `await waitFor(() => isReactReady(findByText('.ant-color-picker-trigger:not(.ant-color-picker-trigger-disabled):not(.ant-color-picker-trigger-active)', '#1677FF')), 'Expected hydrated Ant Design color picker trigger')`,
    run: `
      const trigger = findByText('.ant-color-picker-trigger:not(.ant-color-picker-trigger-disabled):not(.ant-color-picker-trigger-active)', '#1677FF')
      assert(trigger instanceof HTMLElement, 'Expected color picker trigger')
      const activeTriggers = () => document.querySelectorAll('.ant-color-picker-trigger-active').length
      const initialActiveCount = activeTriggers()
      await clickUntil(trigger, () => activeTriggers() > initialActiveCount, 'Expected open color picker')
      await clickUntil(trigger, () => activeTriggers() === initialActiveCount, 'Expected closed color picker')`,
  },
  'antd-date-picker-open-close': {
    name: 'antd-date-picker-open-close',
    url: antdUrl('date-picker'),
    ready: `await waitFor(() => { const input = document.querySelector('.ant-picker input'); return isReactReady(input) && input.value === '' }, 'Expected hydrated blank Ant Design date picker')`,
    run: `
      const input = document.querySelector('.ant-picker input')
      assert(input instanceof HTMLInputElement, 'Expected date picker input')
      input.focus()
      input.click()
      const dropdown = await waitFor(() => document.querySelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)'), 'Expected open date picker')
      const day = dropdown.querySelector('.ant-picker-cell-in-view:not(.ant-picker-cell-disabled) .ant-picker-cell-inner')
      assert(day instanceof HTMLElement, 'Expected selectable date')
      await clickUntil(day, () => input.value !== '', 'Expected selected date')`,
    reloadAfterRun: true,
  },
  'antd-dropdown-open-close': {
    name: 'antd-dropdown-open-close',
    url: antdUrl('dropdown'),
    ready: `await waitFor(() => { const trigger = findByText('button.ant-dropdown-trigger', 'bottomLeft'); return isReactReady(trigger) && trigger.getAttribute('aria-expanded') !== 'true' }, 'Expected hydrated closed Ant Design dropdown')`,
    run: `
      const trigger = findByText('button.ant-dropdown-trigger', 'bottomLeft')
      assert(trigger instanceof HTMLElement, 'Expected bottomLeft dropdown trigger')
      const visibleDropdowns = () => Array.from(document.querySelectorAll('.ant-dropdown:not(.ant-dropdown-hidden)')).filter((element) => getComputedStyle(element).visibility !== 'hidden').length
      const initialDropdownCount = visibleDropdowns()
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }))
      trigger.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      await waitFor(() => visibleDropdowns() > initialDropdownCount, 'Expected open Ant Design dropdown')`,
    reloadAfterRun: true,
  },
  'antd-input-number-step-restore': {
    name: 'antd-input-number-step-restore',
    url: antdUrl('input-number'),
    ready: `await waitFor(() => isReactReady(document.querySelector('.ant-input-number-input[role="spinbutton"]')), 'Expected hydrated Ant Design input number')`,
    run: `
      const input = document.querySelector('.ant-input-number-input[role="spinbutton"]')
      assert(input instanceof HTMLInputElement, 'Expected Ant Design spinbutton')
      const initial = input.value
      input.focus()
      input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowUp' }))
      await waitFor(() => input.value !== initial, 'Expected incremented input number')
      input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }))
      await waitFor(() => input.value === initial, 'Expected restored input number')`,
  },
  'antd-pagination-next-previous': {
    name: 'antd-pagination-next-previous',
    url: antdUrl('pagination'),
    ready: `await waitFor(() => isReactReady(document.querySelector('.ant-pagination .ant-pagination-next button')), 'Expected hydrated Ant Design pagination')`,
    run: `
      const pagination = document.querySelector('.ant-pagination')
      const next = pagination?.querySelector('.ant-pagination-next button')
      const previous = pagination?.querySelector('.ant-pagination-prev button')
      assert(pagination instanceof HTMLElement && next instanceof HTMLElement && previous instanceof HTMLElement, 'Expected pagination controls')
      const current = () => pagination.querySelector('.ant-pagination-item-active')?.textContent?.trim()
      const initial = current()
      next.click()
      await waitFor(() => current() !== initial, 'Expected next pagination page')
      previous.click()
      await waitFor(() => current() === initial, 'Expected restored pagination page')`,
  },
  'antd-segmented-switch-restore': {
    name: 'antd-segmented-switch-restore',
    url: antdUrl('segmented'),
    ready: `await waitFor(() => isReactReady(findByText('.ant-segmented-item', 'Weekly')), 'Expected hydrated Ant Design segmented control')`,
    run: `
      const daily = findByText('.ant-segmented-item', 'Daily')
      const weekly = findByText('.ant-segmented-item', 'Weekly')
      assert(daily instanceof HTMLElement && weekly instanceof HTMLElement && daily.classList.contains('ant-segmented-item-selected'), 'Expected Daily segmented option')
      weekly.click()
      await waitFor(() => weekly.classList.contains('ant-segmented-item-selected'), 'Expected Weekly segmented option')
      daily.click()
      await waitFor(() => daily.classList.contains('ant-segmented-item-selected'), 'Expected restored Daily segmented option')`,
  },
  'antd-slider-step-restore': {
    name: 'antd-slider-step-restore',
    url: antdUrl('slider'),
    ready: `await waitFor(() => isReactReady(document.querySelector('.ant-slider [role="slider"]')), 'Expected hydrated Ant Design slider')`,
    run: `
      const handle = document.querySelector('.ant-slider [role="slider"]')
      assert(handle instanceof HTMLElement, 'Expected Ant Design slider handle')
      const initial = handle.getAttribute('aria-valuenow')
      handle.focus()
      handle.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, code: 'ArrowRight', key: 'ArrowRight', keyCode: 39, which: 39 }))
      handle.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, code: 'ArrowRight', key: 'ArrowRight', keyCode: 39, which: 39 }))
      await waitFor(() => handle.getAttribute('aria-valuenow') !== initial, 'Expected incremented Ant Design slider')
      handle.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, code: 'ArrowLeft', key: 'ArrowLeft', keyCode: 37, which: 37 }))
      handle.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, code: 'ArrowLeft', key: 'ArrowLeft', keyCode: 37, which: 37 }))
      await waitFor(() => handle.getAttribute('aria-valuenow') === initial, 'Expected restored Ant Design slider')`,
  },
  'antd-switch-toggle-restore': {
    name: 'antd-switch-toggle-restore',
    url: antdUrl('switch'),
    ready: `await waitFor(() => isReactReady(document.querySelector('button[role="switch"].ant-switch')), 'Expected hydrated Ant Design switch')`,
    run: `
      const button = document.querySelector('button[role="switch"].ant-switch')
      assert(button instanceof HTMLElement, 'Expected Ant Design switch button')
      const initial = button.getAttribute('aria-checked')
      button.click()
      await waitFor(() => button.getAttribute('aria-checked') !== initial, 'Expected toggled Ant Design switch')
      button.click()
      await waitFor(() => button.getAttribute('aria-checked') === initial, 'Expected restored Ant Design switch')`,
  },
  'antd-tabs-switch-restore': {
    name: 'antd-tabs-switch-restore',
    url: antdUrl('tabs'),
    ready: `await waitFor(() => isReactReady(findByText('[role="tab"]', 'Tab-1')), 'Expected hydrated Ant Design tabs')`,
    run: `
      const first = findByText('[role="tab"]', 'Tab-0')
      const second = findByText('[role="tab"]', 'Tab-1')
      assert(first instanceof HTMLElement && second instanceof HTMLElement, 'Expected Ant Design tab controls')
      second.click()
      await waitFor(() => second.getAttribute('aria-selected') === 'true', 'Expected second Ant Design tab')
      first.click()
      await waitFor(() => first.getAttribute('aria-selected') === 'true', 'Expected restored first Ant Design tab')`,
  },
} satisfies Record<string, ReversibleWidgetConfig>
