import { spawnSync } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(npmCommand, ['run', 'test', '--workspaces', '--if-present'], {
  env: {
    ...process.env,
    FORCE_COLOR: '1',
  },
  shell: process.platform === 'win32',
  stdio: 'inherit',
  windowsHide: true,
})

if (result.error) {
  console.error(`Failed to start ${npmCommand}: ${result.error.message}`)
  process.exitCode = 1
} else {
  process.exitCode = result.status ?? 1
}
