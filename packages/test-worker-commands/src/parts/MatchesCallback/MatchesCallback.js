export const matchesCallback = (target, callback, currentIndex) => {
  if (target.type === callback.type) {
    if (target.url && callback.url && callback.url.test(target.url)) {
      callback.resolve(target)
      return true
    }
    if (currentIndex === callback.index) {
      if (target.url === '') {
        return false
      }
      return true
    }
    currentIndex++
  }
  return false
}
