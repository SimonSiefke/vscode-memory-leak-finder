export const state = {
  pageObjects: Object.create(null),
}

export const getPageObject = (pageObjectId) => {
  const value = state.pageObjects[pageObjectId]
  if (!value) {
    throw new Error(`no page object found`)
  }
  return value.pageObject
}

export const getFirstWindow = (pageObjectId) => {
  const value = state.pageObjects[pageObjectId]
  if (!value) {
    throw new Error(`no page object found`)
  }
  return value.firstWindow
}

export const set = (pageObjectId, pageObject) => {
  state.pageObjects[pageObjectId] = pageObject
}
