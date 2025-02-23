import { VError } from '@lvce-editor/verror'
import { existsSync } from 'fs'
import { join } from 'path'
import * as ExecuteSql from '../ExecuteSql/ExecuteSql.js'
import * as GetDb from '../GetDb/GetDb.js'
import * as LaunchCursorOnce from '../LaunchCursorOnce/LaunchCursorOnce.js'
import * as Root from '../Root/Root.js'
import { join } from 'path'
import * as Root from '../Root/Root.js'
import * as ExecuteSql from '../ExecuteSql/ExecuteSql.js'
import * as GetDb from '../GetDb/GetDb.js'
import { existsSync } from 'fs'
import { VError } from '@lvce-editor/verror'

const keyPrivacyMode = 'cursorai/donotchange/privacyMode'

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
  } catch (error) {
    throw new VError(error, `Failed to skip cursor welcome`)
  }
}
