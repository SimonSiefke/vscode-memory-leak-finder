import * as GetVsCodeEnv from '../src/parts/GetVsCodeEnv/GetVsCodeEnv.js'

test('getVsCodeEnv - remove node options', () => {
  const extensionsFolder = ''
  const runtimeDir = '/test'
  const processEnv = {
    NODE_OPTIONS: '--max-old-space-size=8192',
  }
  expect(GetVsCodeEnv.getVsCodeEnv({ extensionsFolder, runtimeDir, processEnv })).toEqual({
    VSCODE_EXTENSIONS: '',
    XDG_RUNTIME_DIR: '/test',
  })
})
