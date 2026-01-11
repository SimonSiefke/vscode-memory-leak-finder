import { download } from '../Download/Download.ts'
import * as GetJson from '../GetJson/GetJson.ts'

export const commandMap = {
  'Network.download': download,
  'Network.getJson': GetJson.getJson,
}
