const pageObjects = Object.create(null)

export const getPageObject = (pageObjectId) => {
  const value = pageObjects[pageObjectId]
  if (!value) {
    throw new Error(`no page object found with id ${[pageObjectId]}`)
  }
  return value.pageObject
}

export const getPageObjectContext = (pageObjectId) => {
  const value = pageObjects[pageObjectId]
  if (!value) {
    console.log({ pageObjects })
    throw new Error(`no page object context found with id ${[pageObjectId]}`)
  }
  return value.pageObjectContext
}

export const set = (pageObjectId, pageObject, pageObjectContext) => {
  pageObjects[pageObjectId] = {
    pageObject,
    pageObjectContext,
  }
}
