const state = {
  pageObjects: Object.create(null),
}

export const getPageObject = (pageObjectId) => {
  const value = state.pageObjects[pageObjectId]
  if (!value) {
    throw new Error(`no page object found`)
  }
  return value.pageObject
}

export const set = (pageObjectId, pageObject) => {
  state.pageObjects[pageObjectId] = pageObject
}

export const get = (pageObjectId) => {
  const item = state.pageObjects[pageObjectId]
  if (!item) {
    throw new Error(`no page object item with id ${pageObjectId} found`)
  }
  return item
}
