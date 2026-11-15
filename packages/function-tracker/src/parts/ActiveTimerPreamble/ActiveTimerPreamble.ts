export const activeTimerPreamble = `(() => {
  if (typeof globalThis.___memoryLeakFinderGetActiveTimerCounts === 'function') {
    return
  }
  const timeouts = new Set()
  const intervals = new Set()
  const originalSetTimeout = globalThis.setTimeout
  const originalSetInterval = globalThis.setInterval
  const originalClearTimeout = globalThis.clearTimeout
  const originalClearInterval = globalThis.clearInterval

  globalThis.setTimeout = function(callback, delay, ...args) {
    // String handlers execute in the global scope, like native browser timers.
    const handler = typeof callback === 'function' ? callback : String(callback)
    let id
    id = Reflect.apply(originalSetTimeout, this, [function(...callbackArgs) {
      timeouts.delete(id)
      if (typeof handler === 'function') {
        return Reflect.apply(handler, this, callbackArgs)
      }
      return globalThis.eval(handler)
    }, delay, ...args])
    timeouts.add(id)
    return id
  }

  globalThis.setInterval = function(...args) {
    const id = Reflect.apply(originalSetInterval, this, args)
    intervals.add(id)
    return id
  }

  const clear = (original, receiver, id) => {
    // Browser timer handles are Web IDL longs; both clear APIs accept either kind.
    const handle = id | 0
    const result = Reflect.apply(original, receiver, [handle])
    timeouts.delete(handle)
    intervals.delete(handle)
    return result
  }
  globalThis.clearTimeout = function(id) {
    return clear(originalClearTimeout, this, id)
  }
  globalThis.clearInterval = function(id) {
    return clear(originalClearInterval, this, id)
  }
  globalThis.___memoryLeakFinderGetActiveTimerCounts = () => ({
    timeouts: timeouts.size,
    intervals: intervals.size,
  })
})();`
