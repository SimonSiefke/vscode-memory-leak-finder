import { VError } from '@lvce-editor/verror'
import { existsSync } from 'fs'
import { join } from 'path'
import * as ExecuteSql from '../ExecuteSql/ExecuteSql.js'
import * as GetDb from '../GetDb/GetDb.js'
import * as LaunchCursorOnce from '../LaunchCursorOnce/LaunchCursorOnce.js'
import * as MockCursorConfig from '../MockCursorConfig/MockCursorConfig.js'
import * as Root from '../Root/Root.js'

// TODO make this more configurable in case the setting names change
const keyPrivacyMode = 'cursorai/donotchange/privacyMode'
const storageKey = 'src.vs.platform.reactivestorage.browser.reactiveStorageServiceImpl.persistentStorage.applicationUser'

export const skipCursorWelcome = async () => {
  try {
    const storagePath = join(Root.root, '.vscode-user-data-dir', 'User', 'globalStorage', 'state.vscdb')
    if (!existsSync(storagePath)) {
      await LaunchCursorOnce.launchCursorOnce()
    }
    const db = await GetDb.getDb(storagePath)
    const rows = await ExecuteSql.executeSql(db, 'SELECT * FROM ItemTable')
    const privacyMode = rows.find((row) => row.key === keyPrivacyMode)
    if (privacyMode === 'true') {
      return
    }
    const mockConfigString = JSON.stringify(JSON.stringify(MockCursorConfig.mockCursorConfig))
    await ExecuteSql.executeSql(
      db,
      `UPDATE ItemTable
SET ${storageKey} = ${mockConfigString}
; `,
    )
    const privacyValue = JSON.stringify(true)
    await ExecuteSql.executeSql(
      db,
      `UPDATE ItemTable
SET ${keyPrivacyMode} = ${privacyValue}
; `,
    )
  } catch (error) {
    throw new VError(error, `Failed to skip cursor welcome`)
  }
}
