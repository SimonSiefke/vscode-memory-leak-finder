import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const scrollUp = (element, options) => {
  const actualOptions = { deltaX: 10_000, deltaY: -10_000, bubbles: true, detail: 1, ...options }
  DispatchEvent.wheel(element, actualOptions)
}
