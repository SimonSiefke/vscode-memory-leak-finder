export const state = {
  pageObjects: Object.create(null),
}

export const get = (pageObjectId) => {
  return state.pageObjects[pageObjectId]
}

export const set = (pageObjectId, pageObject) => {
  state.pageObjects[pageObjectId] = pageObject
}
