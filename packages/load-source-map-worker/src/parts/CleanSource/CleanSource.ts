const RE_VS = /^vs\//

const RE_EXTERNAL_COMMON_JS = /external commonjs "[a-zA-Z\-\d]+"/

const commonJsExternalReplace = (match) => {
  return match.replaceAll(' ', '/').replaceAll('"', '')
}

export const cleanSource = (source: string): string => {
  if (!source) {
    return ''
  }
  const vscodeIndex = source.indexOf('vscode/')
  if (vscodeIndex !== -1) {
    return source.slice(vscodeIndex + 'vscode/'.length)
  }
  return source
    .replace('webpack://markdown-math', 'extensions/markdown-math')
    .replace('webpack://markdown-language-features/./', 'extensions/markdown-language-features/')
    .replace('webpack://markdown-language-features/', 'extensions/markdown-language-features/')
    .replace('out-vscode/vs/workbench/file:/mnt/vss/_work/1/s', '')
    .replace('file:/Users/cloudtest/vss/_work/1/s/', '')
    .replace(RE_VS, './src/vs/')
    .replace('./src', 'src')
    .replace(RE_EXTERNAL_COMMON_JS, commonJsExternalReplace)
}
