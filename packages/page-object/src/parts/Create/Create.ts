import * as Parts from '../Parts/Parts.ts'

const createLivePage = ({ context, page }: { context: any; page: any }) => {
  let currentPage = page
  let livePage: any

  livePage = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === 'rebind') {
          return async (nextPage: any) => {
            currentPage = nextPage
            context.page = livePage
            context.sessionRpc = nextPage.sessionRpc
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
  return livePage
}

export const create = async (context: any) => {
  const api = Object.create(null)
  const createPageObject = async (page: any) => {
    const childContext: any = {
      ...context,
      reconnectDevtools: undefined,
    }
    const livePage = createLivePage({
      context: childContext,
      page,
    })
    childContext.createPageObject = createPageObject
    childContext.page = livePage
    childContext.sessionRpc = page.sessionRpc
    const api = await create(childContext)
    Object.defineProperty(api, '__page', {
      value: livePage,
    })
    return api
  }
  const partContext = {
    ...context,
    createPageObject,
  }
  for (const [key, value] of Object.entries(Parts)) {
    if (key === 'WellKnownCommands') {
      api[key] = value
    } else {
      // @ts-ignore
      api[key] = value.create(partContext)
    }
  }
  return api
}
