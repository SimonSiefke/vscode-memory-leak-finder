import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const defaultVsCodeSettingsPath = join(
  Root.root,
  'packages',
  'test-coordinator',
  'src',
  'parts',
  'DefaultVsCodeSettings',
  'DefaultVsCodeSettings.json',
)
