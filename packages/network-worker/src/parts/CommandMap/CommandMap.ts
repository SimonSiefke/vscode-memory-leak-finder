import { download } from '../Download/Download.ts'
import * as GetJson from '../GetJson/GetJson.ts'

export const commandMap = {
  'Network.getJson': GetJson.getJson,
  'Network.download': download,
}
