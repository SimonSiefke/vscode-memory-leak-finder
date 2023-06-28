import { join } from 'path'
import * as Root from '../Root/Root.js'

export const defaultVsCodeSettingsPath = join(
  Root.root,
  'packages',
  'test-worker-commands',
  'src',
  'parts',
  'DefaultVsCodeSettings',
  'DefaultVsCodeSettings.json'
)
