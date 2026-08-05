import type { ReversibleWidgetConfig } from '../reversibleWidget.ts'

const componentUrl = (component: string): string => `https://getbootstrap.com/docs/5.3/components/${component}/`

export const bootstrapWidgetConfigs = {
  'bootstrap-accordion-toggle-restore': {
    name: 'bootstrap-accordion-toggle-restore',
    url: componentUrl('accordion'),
    ready: `await waitFor(() => document.querySelector('#accordionExample button[aria-controls="collapseOne"]'), 'Expected Bootstrap accordion')`,
    run: `
      const button = document.querySelector('#accordionExample button[aria-controls="collapseOne"]')
      assert(button instanceof HTMLElement && button.getAttribute('aria-expanded') === 'true', 'Expected expanded first accordion item')
      await clickUntil(button, () => button.getAttribute('aria-expanded') === 'false', 'Expected collapsed accordion item')
      const panel = document.querySelector('#collapseOne')
      await waitFor(() => panel instanceof HTMLElement && !panel.classList.contains('collapsing'), 'Expected completed accordion collapse')
      await clickUntil(button, () => button.getAttribute('aria-expanded') === 'true', 'Expected restored accordion item')`,
  },
  'bootstrap-carousel-next-previous': {
    name: 'bootstrap-carousel-next-previous',
    url: componentUrl('carousel'),
    ready: `await waitFor(() => document.querySelector('#carouselExample .carousel-item.active'), 'Expected Bootstrap carousel')`,
    run: `
      const carousel = document.querySelector('#carouselExample')
      const next = carousel?.querySelector('.carousel-control-next')
      const previous = carousel?.querySelector('.carousel-control-prev')
      assert(carousel instanceof HTMLElement && next instanceof HTMLElement && previous instanceof HTMLElement, 'Expected carousel controls')
      const activeIndex = () => Array.from(carousel.querySelectorAll('.carousel-item')).findIndex((item) => item.classList.contains('active'))
      const initial = activeIndex()
      next.click()
      await waitFor(() => activeIndex() !== initial, 'Expected next carousel slide')
      previous.click()
      await waitFor(() => activeIndex() === initial, 'Expected original carousel slide')`,
  },
  'bootstrap-collapse-toggle': {
    name: 'bootstrap-collapse-toggle',
    url: componentUrl('collapse'),
    ready: `await waitFor(() => document.querySelector('[data-bs-target="#collapseExample"]'), 'Expected Bootstrap collapse control')`,
    run: `
      const button = document.querySelector('[data-bs-target="#collapseExample"]')
      const panel = document.querySelector('#collapseExample')
      assert(button instanceof HTMLElement && panel instanceof HTMLElement && !panel.classList.contains('show'), 'Expected collapsed panel')
      await clickUntil(button, () => panel.classList.contains('show'), 'Expected visible collapse panel')
      await clickUntil(button, () => !panel.classList.contains('show'), 'Expected restored collapsed panel')`,
  },
  'bootstrap-dropdown-open-close': {
    name: 'bootstrap-dropdown-open-close',
    url: componentUrl('dropdowns'),
    ready: `await waitFor(() => document.querySelector('.bd-example .dropdown-toggle'), 'Expected Bootstrap dropdown')`,
    run: `
      const button = document.querySelector('.bd-example .dropdown-toggle')
      assert(button instanceof HTMLElement, 'Expected dropdown button')
      button.click()
      await waitFor(() => button.getAttribute('aria-expanded') === 'true', 'Expected open dropdown')
      button.click()
      await waitFor(() => button.getAttribute('aria-expanded') === 'false', 'Expected closed dropdown')`,
  },
  'bootstrap-list-group-tab-restore': {
    name: 'bootstrap-list-group-tab-restore',
    url: componentUrl('list-group'),
    ready: `await waitFor(() => document.querySelector('#list-tab [href="#list-profile"]'), 'Expected Bootstrap list-group tabs')`,
    run: `
      const home = document.querySelector('#list-tab [href="#list-home"]')
      const profile = document.querySelector('#list-tab [href="#list-profile"]')
      assert(home instanceof HTMLElement && profile instanceof HTMLElement, 'Expected list-group tab controls')
      profile.click()
      await waitFor(() => profile.getAttribute('aria-selected') === 'true', 'Expected profile list tab')
      home.click()
      await waitFor(() => home.getAttribute('aria-selected') === 'true', 'Expected restored home list tab')`,
  },
  'bootstrap-modal-open-close': {
    name: 'bootstrap-modal-open-close',
    url: componentUrl('modal'),
    ready: `await waitFor(() => document.querySelector('[data-bs-target="#exampleModal"]'), 'Expected Bootstrap modal trigger')`,
    run: `
      const trigger = document.querySelector('[data-bs-target="#exampleModal"]')
      const modal = document.querySelector('#exampleModal')
      assert(trigger instanceof HTMLElement && modal instanceof HTMLElement, 'Expected modal controls')
      await clickUntil(trigger, () => modal.classList.contains('show'), 'Expected open modal')
      await waitFor(() => getComputedStyle(modal).opacity === '1', 'Expected completed modal opening transition')
      const close = Array.from(modal.querySelectorAll('[data-bs-dismiss="modal"]')).find((element) => (element.textContent || '').trim() === 'Close')
      assert(close instanceof HTMLElement, 'Expected modal close control')
      await clickUntil(close, () => !modal.classList.contains('show') && modal.offsetParent === null, 'Expected closed modal')`,
  },
  'bootstrap-offcanvas-open-close': {
    name: 'bootstrap-offcanvas-open-close',
    url: componentUrl('offcanvas'),
    ready: `await waitFor(() => document.querySelector('[data-bs-target="#offcanvasExample"]'), 'Expected Bootstrap offcanvas trigger')`,
    run: `
      const trigger = document.querySelector('[data-bs-target="#offcanvasExample"]')
      const panel = document.querySelector('#offcanvasExample')
      assert(trigger instanceof HTMLElement && panel instanceof HTMLElement, 'Expected offcanvas controls')
      trigger.click()
      await waitFor(() => panel.classList.contains('show'), 'Expected open offcanvas')
      const close = panel.querySelector('[data-bs-dismiss="offcanvas"]')
      assert(close instanceof HTMLElement, 'Expected offcanvas close control')
      close.click()
      await waitFor(() => !panel.classList.contains('show'), 'Expected closed offcanvas')`,
  },
  'bootstrap-popover-open-close': {
    name: 'bootstrap-popover-open-close',
    url: componentUrl('popovers'),
    ready: `await waitFor(() => document.querySelector('.bd-example [data-bs-toggle="popover"]'), 'Expected Bootstrap popover trigger')`,
    run: `
      const trigger = document.querySelector('.bd-example [data-bs-toggle="popover"]')
      assert(trigger instanceof HTMLElement, 'Expected popover trigger')
      trigger.click()
      await waitFor(() => document.querySelector('.popover.show'), 'Expected visible popover')
      trigger.click()
      await waitFor(() => !document.querySelector('.popover.show'), 'Expected removed popover')`,
  },
  'bootstrap-range-change-restore': {
    name: 'bootstrap-range-change-restore',
    url: 'https://getbootstrap.com/docs/5.3/forms/range/',
    ready: `await waitFor(() => document.querySelector('.bd-example input[type="range"]'), 'Expected Bootstrap range input')`,
    run: `
      const input = document.querySelector('.bd-example input[type="range"]')
      assert(input instanceof HTMLInputElement, 'Expected range input')
      const initial = input.value
      input.value = String(Math.min(Number(input.max || 100), Number(initial) + 1))
      input.dispatchEvent(new Event('input', { bubbles: true }))
      assert(input.value !== initial, 'Expected changed range value')
      input.value = initial
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      assert(input.value === initial, 'Expected restored range value')`,
  },
  'bootstrap-tabs-switch-restore': {
    name: 'bootstrap-tabs-switch-restore',
    url: componentUrl('navs-tabs'),
    ready: `await waitFor(() => document.querySelector('#nav-tab #nav-profile-tab'), 'Expected Bootstrap tab demo')`,
    run: `
      const home = document.querySelector('#nav-tab #nav-home-tab')
      const profile = document.querySelector('#nav-tab #nav-profile-tab')
      assert(home instanceof HTMLElement && profile instanceof HTMLElement, 'Expected tab controls')
      profile.click()
      await waitFor(() => profile.getAttribute('aria-selected') === 'true', 'Expected profile tab')
      home.click()
      await waitFor(() => home.getAttribute('aria-selected') === 'true', 'Expected restored home tab')`,
  },
  'bootstrap-toast-show-close': {
    name: 'bootstrap-toast-show-close',
    url: componentUrl('toasts'),
    ready: `await waitFor(() => document.querySelector('#liveToastBtn'), 'Expected Bootstrap toast trigger')`,
    run: `
      const trigger = document.querySelector('#liveToastBtn')
      const toast = document.querySelector('#liveToast')
      assert(trigger instanceof HTMLElement && toast instanceof HTMLElement, 'Expected toast controls')
      trigger.click()
      await waitFor(() => toast.classList.contains('show'), 'Expected visible toast')
      const close = toast.querySelector('[data-bs-dismiss="toast"]')
      assert(close instanceof HTMLElement, 'Expected toast close control')
      close.click()
      await waitFor(() => !toast.classList.contains('show'), 'Expected hidden toast')`,
  },
} satisfies Record<string, ReversibleWidgetConfig>
