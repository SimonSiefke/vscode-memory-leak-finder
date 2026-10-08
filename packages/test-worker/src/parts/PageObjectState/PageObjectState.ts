const pageObjects = Object.create(null)

export const getPageObject = (pageObjectId: any) => {
  const value = pageObjects[pageObjectId]
  if (!value) {
    throw new Error(`no page object found with id ${[pageObjectId]}`)
  }
  return value.pageObject
}

export const getPageObjectContext = (pageObjectId: any) => {
  const value = pageObjects[pageObjectId]
  if (!value) {
    throw new Error(`no page object context found with id ${[pageObjectId]}`)
  }
  return value.pageObjectContext
}

export const set = (pageObjectId: any, pageObject: any, pageObjectContext: any) => {
  pageObjects[pageObjectId] = {
    pageObject,
    pageObjectContext,
  }
}
