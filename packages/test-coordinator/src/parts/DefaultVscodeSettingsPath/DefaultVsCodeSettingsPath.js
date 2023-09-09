import { join } from 'path'
import * as Root from '../Root/Root.js'

export const defaultVsCodeSettingsPath = join(
  Root.root,
  'packages',
  'test-coordinator',
  'src',
  'parts',
  'DefaultVsCodeSettings',
  'DefaultVsCodeSettings.json',
)
