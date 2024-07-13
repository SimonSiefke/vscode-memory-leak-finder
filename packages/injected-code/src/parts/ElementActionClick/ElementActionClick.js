import * as DispatchEvent from '../DispatchEvent/DispatchEvent.js'

export const click = (element, options) => {
  console.log({ parentHtml: element.parentNode.outerHTML })
  const rect = element.getBoundingClientRect()
  options.clientX = (rect.left + rect.right) / 2
  options.clientY = (rect.top + rect.bottom) / 2
  options.cancelable = true
  if (options.button === 'right') {
    options.button = 2
  }
  DispatchEvent.pointerDown(element, options)
  DispatchEvent.mouseDown(element, options)
  if (options.button !== 2 /* right */) {
    DispatchEvent.click(element, options)
  }
  DispatchEvent.mouseUp(element, options)
  DispatchEvent.pointerUp(element, options)
  if (options.button === 2 /* right */) {
    DispatchEvent.contextMenu(element, options)
  }
}
