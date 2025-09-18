const pageObjects = Object.create(null)

export const getPageObject = (pageObjectId) => {
  const value = pageObjects[pageObjectId]
  if (!value) {
    throw new Error(`no page object found`)
  }
  return value
}

export const set = (pageObjectId, pageObject) => {
  pageObjects[pageObjectId] = pageObject
}
