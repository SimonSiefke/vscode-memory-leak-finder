import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const scrollUp = (element, options) => {
  const actualOptions = { deltaX: 10000, deltaY: -10000, bubbles: true, detail: 1, ...options }
  DispatchEvent.wheel(element, actualOptions)
}
