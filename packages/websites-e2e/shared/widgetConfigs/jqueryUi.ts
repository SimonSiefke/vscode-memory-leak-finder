import type { ReversibleWidgetConfig } from '../reversibleWidget.ts'

const demoUrl = (widget: string, demo = 'default'): string => `https://jqueryui.com/resources/demos/${widget}/${demo}.html`

const mouseDrag = `
      const drag = (element, fromX, fromY, toX, toY, modifier = {}) => {
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, buttons: 1, clientX: fromX, clientY: fromY, ...modifier }))
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, buttons: 1, clientX: fromX + (toX - fromX) / 3, clientY: fromY + (toY - fromY) / 3, ...modifier }))
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, buttons: 1, clientX: fromX + ((toX - fromX) * 2) / 3, clientY: fromY + ((toY - fromY) * 2) / 3, ...modifier }))
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, buttons: 1, clientX: toX, clientY: toY, ...modifier }))
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, clientX: toX, clientY: toY, ...modifier }))
      }`

export const jqueryUiWidgetConfigs = {
  'jqueryui-accordion-switch-restore': {
    name: 'jqueryui-accordion-switch-restore',
    url: demoUrl('accordion'),
    ready: `await waitFor(() => document.querySelectorAll('#accordion h3').length === 4, 'Expected jQuery UI accordion')`,
    run: `
      const headings = document.querySelectorAll('#accordion h3')
      const first = headings[0]
      const second = headings[1]
      assert(first instanceof HTMLElement && second instanceof HTMLElement, 'Expected accordion headings')
      second.click()
      await waitFor(() => second.getAttribute('aria-selected') === 'true' || second.getAttribute('aria-expanded') === 'true', 'Expected second accordion panel')
      first.click()
      await waitFor(() => first.getAttribute('aria-selected') === 'true' || first.getAttribute('aria-expanded') === 'true', 'Expected restored first accordion panel')`,
  },
  'jqueryui-autocomplete-select-clear': {
    name: 'jqueryui-autocomplete-select-clear',
    url: demoUrl('autocomplete'),
    ready: `await waitFor(() => document.querySelector('#tags'), 'Expected jQuery UI autocomplete')`,
    run: `
      const input = document.querySelector('#tags')
      assert(input instanceof HTMLInputElement, 'Expected autocomplete input')
      input.focus()
      input.value = 'Ja'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      const option = await waitFor(() => Array.from(document.querySelectorAll('.ui-autocomplete .ui-menu-item-wrapper')).find((item) => item.textContent === 'JavaScript'), 'Expected JavaScript autocomplete option')
      option.click()
      await waitFor(() => input.value === 'JavaScript', 'Expected selected autocomplete value')
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }))
      input.blur()
      await waitFor(() => input.value === '' && !document.querySelector('.ui-autocomplete:not([style*="display: none"])'), 'Expected cleared autocomplete')`,
  },
  'jqueryui-checkboxradio-toggle': {
    name: 'jqueryui-checkboxradio-toggle',
    url: demoUrl('checkboxradio'),
    ready: `await waitFor(() => document.querySelector('#checkbox-1'), 'Expected jQuery UI checkboxradio')`,
    run: `
      const input = document.querySelector('#checkbox-1')
      assert(input instanceof HTMLInputElement && !input.checked, 'Expected unchecked checkboxradio')
      input.click()
      await waitFor(() => input.checked, 'Expected checked checkboxradio')
      input.click()
      await waitFor(() => !input.checked, 'Expected restored unchecked checkboxradio')`,
  },
  'jqueryui-controlgroup-toggle': {
    name: 'jqueryui-controlgroup-toggle',
    url: demoUrl('controlgroup'),
    ready: `await waitFor(() => document.querySelector('#insurance'), 'Expected jQuery UI controlgroup')`,
    run: `
      const input = document.querySelector('#insurance')
      assert(input instanceof HTMLInputElement && !input.checked, 'Expected unchecked insurance control')
      input.click()
      await waitFor(() => input.checked, 'Expected checked controlgroup option')
      input.click()
      await waitFor(() => !input.checked, 'Expected restored controlgroup option')`,
  },
  'jqueryui-datepicker-select-clear': {
    name: 'jqueryui-datepicker-select-clear',
    url: demoUrl('datepicker'),
    ready: `await waitFor(() => document.querySelector('#datepicker'), 'Expected jQuery UI datepicker input')`,
    run: `
      const input = document.querySelector('#datepicker')
      assert(input instanceof HTMLInputElement && input.value === '', 'Expected blank date input')
      input.focus()
      const day = await waitFor(() => document.querySelector('#ui-datepicker-div:not([style*="display: none"]) .ui-datepicker-calendar td:not(.ui-datepicker-unselectable) a'), 'Expected open datepicker')
      day.click()
      await waitFor(() => input.value !== '', 'Expected selected date')
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      input.blur()
      assert(input.value === '', 'Expected cleared date input')`,
  },
  'jqueryui-dialog-close-reload': {
    name: 'jqueryui-dialog-close-reload',
    url: demoUrl('dialog'),
    ready: `await waitFor(() => document.querySelector('.ui-dialog:has(#dialog)'), 'Expected open jQuery UI dialog')`,
    run: `
      const dialog = document.querySelector('.ui-dialog:has(#dialog)')
      const close = dialog?.querySelector('.ui-dialog-titlebar-close')
      assert(dialog instanceof HTMLElement && close instanceof HTMLElement, 'Expected dialog close control')
      close.click()
      await waitFor(() => dialog.offsetParent === null, 'Expected closed dialog')`,
    reloadAfterRun: true,
  },
  'jqueryui-draggable-move-restore': {
    name: 'jqueryui-draggable-move-restore',
    url: demoUrl('draggable'),
    ready: `await waitFor(() => document.querySelector('#draggable'), 'Expected jQuery UI draggable')`,
    run: `${mouseDrag}
      const item = document.querySelector('#draggable')
      assert(item instanceof HTMLElement, 'Expected draggable item')
      const initialLeft = item.style.left
      const initialTop = item.style.top
      const rect = item.getBoundingClientRect()
      drag(item, rect.left + 10, rect.top + 10, rect.left + 70, rect.top + 50)
      await waitFor(() => item.style.left !== initialLeft || item.style.top !== initialTop, 'Expected moved draggable')`,
    reloadAfterRun: true,
  },
  'jqueryui-droppable-drag-reload': {
    name: 'jqueryui-droppable-drag-reload',
    url: demoUrl('droppable'),
    ready: `await waitFor(() => document.querySelector('#draggable') && document.querySelector('#droppable'), 'Expected jQuery UI droppable demo')`,
    run: `${mouseDrag}
      const item = document.querySelector('#draggable')
      const target = document.querySelector('#droppable')
      assert(item instanceof HTMLElement && target instanceof HTMLElement, 'Expected draggable and droppable')
      const from = item.getBoundingClientRect()
      const to = target.getBoundingClientRect()
      drag(item, from.left + 10, from.top + 10, to.left + to.width / 2, to.top + to.height / 2)
      await waitFor(() => target.classList.contains('ui-state-highlight') || /Dropped/i.test(target.textContent || ''), 'Expected successful drop')`,
    reloadAfterRun: true,
  },
  'jqueryui-menu-submenu-open-close': {
    name: 'jqueryui-menu-submenu-open-close',
    url: demoUrl('menu'),
    ready: `await waitFor(() => document.querySelector('#menu [aria-haspopup="true"]'), 'Expected jQuery UI submenu')`,
    run: `
      const item = document.querySelector('#menu [aria-haspopup="true"]')
      assert(item instanceof HTMLElement, 'Expected submenu item')
      const submenu = item.closest('li')?.querySelector('ul')
      assert(submenu instanceof HTMLElement, 'Expected nested submenu')
      item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }))
      item.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      await waitFor(() => submenu.offsetParent !== null, 'Expected open submenu')
      `,
    reloadAfterRun: true,
  },
  'jqueryui-resizable-resize-restore': {
    name: 'jqueryui-resizable-resize-restore',
    url: demoUrl('resizable'),
    ready: `await waitFor(() => document.querySelector('#resizable .ui-resizable-se'), 'Expected jQuery UI resizable')`,
    run: `
      const item = document.querySelector('#resizable')
      const handle = item?.querySelector('.ui-resizable-se')
      assert(item instanceof HTMLElement && handle instanceof HTMLElement, 'Expected resizable handle')
      const initialWidth = item.offsetWidth
      const initialHeight = item.offsetHeight
      const rect = handle.getBoundingClientRect()
      const fromX = rect.left + rect.width / 2
      const fromY = rect.top + rect.height / 2
      const instance = globalThis.jQuery(item).resizable('instance')
      assert(instance, 'Expected initialized resizable instance')
      instance.axis = 'se'
      const start = globalThis.jQuery.Event('mousedown', { target: handle, which: 1, pageX: fromX, pageY: fromY })
      const end = globalThis.jQuery.Event('mousemove', { target: handle, which: 1, pageX: fromX + 40, pageY: fromY + 30 })
      instance._mouseStart(start)
      instance._mouseDrag(end)
      instance._mouseStop(end)
      await waitFor(() => item.offsetWidth > initialWidth && item.offsetHeight > initialHeight, 'Expected resized element')`,
    reloadAfterRun: true,
  },
  'jqueryui-selectable-select-clear': {
    name: 'jqueryui-selectable-select-clear',
    url: demoUrl('selectable'),
    ready: `await waitFor(() => document.querySelector('#selectable li'), 'Expected jQuery UI selectable')`,
    run: `${mouseDrag}
      const item = document.querySelector('#selectable li')
      assert(item instanceof HTMLElement, 'Expected selectable item')
      const rect = item.getBoundingClientRect()
      drag(item, rect.left + 5, rect.top + 5, rect.right - 5, rect.bottom - 5)
      await waitFor(() => item.classList.contains('ui-selected'), 'Expected selected item')`,
    reloadAfterRun: true,
  },
  'jqueryui-selectmenu-select-restore': {
    name: 'jqueryui-selectmenu-select-restore',
    url: demoUrl('selectmenu'),
    ready: `await waitFor(() => document.querySelector('#speed-button'), 'Expected jQuery UI selectmenu')`,
    run: `
      const button = document.querySelector('#speed-button')
      const select = document.querySelector('#speed')
      assert(button instanceof HTMLElement && select instanceof HTMLSelectElement && select.value === 'Medium', 'Expected Medium selectmenu value')
      button.click()
      const fast = await waitFor(() => document.querySelector('#speed-menu')?.offsetParent !== null && Array.from(document.querySelectorAll('#speed-menu .ui-menu-item-wrapper')).find((item) => item.textContent === 'Fast'), 'Expected visible Fast option')
      await clickUntil(fast, () => select.value === 'Fast', 'Expected Fast selectmenu value')`,
    reloadAfterRun: true,
  },
  'jqueryui-slider-step-restore': {
    name: 'jqueryui-slider-step-restore',
    url: demoUrl('slider'),
    ready: `await waitFor(() => document.querySelector('#slider .ui-slider-handle'), 'Expected jQuery UI slider')`,
    run: `
      const handle = document.querySelector('#slider .ui-slider-handle')
      assert(handle instanceof HTMLElement, 'Expected slider handle')
      const slider = globalThis.jQuery('#slider')
      const initial = slider.slider('value')
      handle.focus()
      globalThis.jQuery(handle).trigger(globalThis.jQuery.Event('keydown', { key: 'ArrowRight', keyCode: 39, which: 39 }))
      globalThis.jQuery(handle).trigger(globalThis.jQuery.Event('keyup', { key: 'ArrowRight', keyCode: 39, which: 39 }))
      await waitFor(() => slider.slider('value') > initial && handle.style.left !== '0%', 'Expected incremented slider')`,
    reloadAfterRun: true,
  },
  'jqueryui-sortable-reorder-restore': {
    name: 'jqueryui-sortable-reorder-restore',
    url: demoUrl('sortable'),
    ready: `await waitFor(() => document.querySelectorAll('#sortable li').length > 2, 'Expected jQuery UI sortable')`,
    run: `${mouseDrag}
      const list = document.querySelector('#sortable')
      assert(list instanceof HTMLElement, 'Expected sortable list')
      const initial = Array.from(list.children).map((item) => item.textContent).join('|')
      let first = list.children[0]
      let second = list.children[1]
      let from = first.getBoundingClientRect()
      let to = second.getBoundingClientRect()
      drag(first, from.left + 10, from.top + 10, to.left + 10, to.bottom - 2)
      await waitFor(() => Array.from(list.children).map((item) => item.textContent).join('|') !== initial, 'Expected reordered list')
      first = Array.from(list.children).find((item) => item.textContent?.includes('Item 1'))
      second = list.children[0]
      assert(first instanceof HTMLElement && second instanceof HTMLElement, 'Expected moved sortable item')
      from = first.getBoundingClientRect()
      to = second.getBoundingClientRect()
      drag(first, from.left + 10, from.top + 10, to.left + 10, to.top + 2)
      await waitFor(() => Array.from(list.children).map((item) => item.textContent).join('|') === initial, 'Expected restored sortable list')`,
  },
  'jqueryui-spinner-step-restore': {
    name: 'jqueryui-spinner-step-restore',
    url: demoUrl('spinner'),
    ready: `await waitFor(() => document.querySelector('#spinner'), 'Expected jQuery UI spinner')`,
    run: `
      const input = document.querySelector('#spinner')
      const wrapper = input?.closest('.ui-spinner')
      const up = wrapper?.querySelector('.ui-spinner-up')
      assert(input instanceof HTMLInputElement && up instanceof HTMLElement, 'Expected spinner controls')
      const initial = input.value
      input.focus()
      input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, code: 'ArrowUp', key: 'ArrowUp', keyCode: 38, which: 38 }))
      await waitFor(() => input.value !== initial, 'Expected incremented spinner')`,
    reloadAfterRun: true,
  },
  'jqueryui-tabs-switch-restore': {
    name: 'jqueryui-tabs-switch-restore',
    url: demoUrl('tabs'),
    ready: `await waitFor(() => document.querySelectorAll('#tabs [role="tab"]').length >= 2, 'Expected jQuery UI tabs')`,
    run: `
      const tabs = document.querySelectorAll('#tabs [role="tab"]')
      const first = tabs[0]
      const second = tabs[1]
      assert(first instanceof HTMLElement && second instanceof HTMLElement, 'Expected tab controls')
      const secondLink = second.querySelector('a')
      assert(secondLink instanceof HTMLElement, 'Expected second tab link')
      secondLink.click()
      await waitFor(() => second.getAttribute('aria-selected') === 'true', 'Expected second tab')`,
    reloadAfterRun: true,
  },
  'jqueryui-tooltip-open-close': {
    name: 'jqueryui-tooltip-open-close',
    url: demoUrl('tooltip'),
    ready: `await waitFor(() => document.querySelector('#age'), 'Expected jQuery UI tooltip input')`,
    run: `
      const input = document.querySelector('#age')
      assert(input instanceof HTMLInputElement, 'Expected tooltip input')
      input.focus()
      await waitFor(() => document.querySelector('.ui-tooltip'), 'Expected visible tooltip')
      input.blur()
      await waitFor(() => !document.querySelector('.ui-tooltip'), 'Expected removed tooltip')`,
  },
  'jqueryui-toggleclass-run-restore': {
    name: 'jqueryui-toggleclass-run-restore',
    url: 'https://jqueryui.com/resources/demos/effect/toggleClass.html',
    ready: `await waitFor(() => document.querySelector('#button') && document.querySelector('#effect'), 'Expected jQuery UI toggleClass demo')`,
    run: `
      const button = document.querySelector('#button')
      const effect = document.querySelector('#effect')
      assert(button instanceof HTMLElement && effect instanceof HTMLElement, 'Expected toggleClass controls')
      const initial = effect.className
      button.click()
      await waitFor(() => effect.className !== initial, 'Expected toggled effect class')`,
    reloadAfterRun: true,
  },
} satisfies Record<string, ReversibleWidgetConfig>
