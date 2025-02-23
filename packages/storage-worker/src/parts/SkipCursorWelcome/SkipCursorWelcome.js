import { VError } from '@lvce-editor/verror'
import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import * as ExecuteSql from '../ExecuteSql/ExecuteSql.js'
import * as GetDb from '../GetDb/GetDb.js'
import * as LaunchCursorOnce from '../LaunchCursorOnce/LaunchCursorOnce.js'
import * as MockCursorConfig from '../MockCursorConfig/MockCursorConfig.js'
import * as Root from '../Root/Root.js'

// TODO make this more configurable in case the setting names change
const keyPrivacyMode = 'cursorai/donotchange/privacyMode'
const storageKey = 'src.vs.platform.reactivestorage.browser.reactiveStorageServiceImpl.persistentStorage.applicationUser'
const startupKey = `workbench.services.onFirstStartupService.isVeryFirstTime`
const membershipKey = `cursorAuth/stripeMembershipType`

export const skipCursorWelcome = async () => {
  try {
    const storagePath = join(Root.root, '.vscode-user-data-dir', 'User', 'globalStorage', 'state.vscdb')
    if (!existsSync(storagePath)) {
      await LaunchCursorOnce.launchCursorOnce()
    }
    const db = await GetDb.getDb(storagePath)
    const rows = await ExecuteSql.executeSql(db, 'SELECT * FROM ItemTable')
    const privacyMode = rows.find((row) => row.key === keyPrivacyMode)
    writeFileSync('./rows.json', JSON.stringify(rows, null, 2))
    if (privacyMode === 'true') {
      return
    }
    const stringifiedConfig = JSON.stringify(MockCursorConfig.mockCursorConfig)

    const privacyValue = true
    const startupValue = 'false'
    const membershipValue = 'free'
    const statement = `INSERT INTO ItemTable (key, value)
VALUES
('${keyPrivacyMode}', '${privacyValue}'),
('${storageKey}', '${stringifiedConfig}'),
('${startupKey}', '${startupValue}'),
('${membershipKey}', '${membershipValue}');
`

    await ExecuteSql.executeSql(db, statement)
  } catch (error) {
    throw new VError(error, `Failed to skip cursor welcome`)
  }
}
