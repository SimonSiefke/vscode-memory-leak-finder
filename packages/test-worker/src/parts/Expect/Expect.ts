import * as ExpectDefault from '../ExpectDefault/ExpectDefault.ts'
import * as ExpectElectronApp from '../ExpectElectronApp/ExpectElectronApp.ts'
import * as ExpectLocator from '../ExpectLocator/ExpectLocator.ts'
import * as ExpectPage from '../ExpectPage/ExpectPage.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'

export const expect = (args) => {
  const type = args ? args.objectType || args.type || '' : ''
  switch (type) {
    case ObjectType.Locator:
      return ExpectLocator.expect(args)
    case ObjectType.Page:
      return ExpectPage.expect(args)
    case ObjectType.ElectronApp:
      return ExpectElectronApp.expect(args)
    default:
      return ExpectDefault.expect(args)
  }
}
