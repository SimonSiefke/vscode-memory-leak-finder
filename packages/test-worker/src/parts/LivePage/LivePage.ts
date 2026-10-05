export const create = ({ onRebind, page }) => {
  let currentPage = page

  return new Proxy(
    {},
    {
      get(_target, property) {
        if (property === 'rebind') {
          return async (nextPage) => {
            currentPage = nextPage
            await onRebind(nextPage)
          }
        }
        const value = Reflect.get(currentPage, property)
        if (typeof value === 'function') {
          return value.bind(currentPage)
        }
        return value
      },
      set(_target, property, value) {
        Reflect.set(currentPage, property, value)
        return true
      },
    },
  )
}
