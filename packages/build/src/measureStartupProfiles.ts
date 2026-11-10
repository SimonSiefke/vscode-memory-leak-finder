import { parseArgs } from 'node:util'
import { collectStartupProfiles } from './parts/StartupProfiles/StartupProfiles.ts'

const { values } = parseArgs({
  options: { executable: { type: 'string' }, output: { type: 'string' }, samples: { type: 'string', default: '7' } },
})
if (!values.executable || !values.output)
  throw new Error(
    'Usage: node packages/build/src/measureStartupProfiles.ts --executable /path/to/code --output /new/results/startup-performance --samples 7',
  )
await collectStartupProfiles(values.executable, values.output, Number(values.samples))
