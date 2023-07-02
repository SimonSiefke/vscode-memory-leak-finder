import * as DispatchEvent from '../DispatchEvent/DispatchEvent.js'

export const click = (element, options) => {
  if (options.button === 'right') {
    options.button = 2
  }
  const rect = element.getBoundingClientRect()
  const x = rect.x + rect.width / 2
  const y = rect.y + rect.height / 2
  options.clientX = x
  options.clientY = y
  options.x = x
  options.y = y
  DispatchEvent.mouseDown(element, options)
  DispatchEvent.click(element, options)
  DispatchEvent.mouseUp(element, options)
  if (options.button === 2 /* right */ || options.button === 'right') {
    DispatchEvent.contextMenu(element, options)
  }
}
