/**
 * Prevents webview elements from stealing focus, which can cause flaky tests
 * particularly with quickpick interactions where focus loss closes the quickpick
 */

let originalWindowFocus: typeof window.focus | null = null
let originalElementFocus: typeof HTMLElement.prototype.focus | null = null

export const install = () => {
  if (originalWindowFocus || originalElementFocus) {
    return // Already installed
  }

  // Store original functions
  originalWindowFocus = window.focus
  originalElementFocus = HTMLElement.prototype.focus

  // Override window.focus
  window.focus = function (this: Window) {
    // Allow normal window focus behavior
    return originalWindowFocus!.apply(this)
  }

  // Override HTMLElement.prototype.focus
  HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions) {
    // Check if this element or any parent is a webview
    if (isWebviewElement(this)) {
      // Silently ignore focus attempts on webview elements
      return
    }
    
    // Allow normal focus behavior for non-webview elements
    return originalElementFocus!.apply(this, [options])
  }
}

export const uninstall = () => {
  if (originalWindowFocus) {
    window.focus = originalWindowFocus
    originalWindowFocus = null
  }
  
  if (originalElementFocus) {
    HTMLElement.prototype.focus = originalElementFocus
    originalElementFocus = null
  }
}

/**
 * Check if an element is a webview or contained within a webview
 */
const isWebviewElement = (element: HTMLElement): boolean => {
  let current: HTMLElement | null = element
  
  while (current) {
    // Check for webview class or webview-related attributes
    if (current.classList.contains('webview') || 
        current.classList.contains('webview-container') ||
        current.tagName.toLowerCase() === 'webview' ||
        current.hasAttribute('data-webview') ||
        current.hasAttribute('webview')) {
      return true
    }
    
    current = current.parentElement
  }
  
  return false
}