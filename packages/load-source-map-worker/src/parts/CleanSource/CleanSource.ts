const RE_VS = /^vs\//

const RE_EXTERNAL_COMMON_JS = /external commonjs "[a-zA-Z\-\d]+"/

const commonJsExternalReplace = (match: string): string => {
  return match.replaceAll(' ', '/').replaceAll('"', '')
}

const RE_RELATIVE_SRC_PATH = /^(?:\.\/|\.\.\/)+\.?src\//
const RE_WEBPACK_URL = /^webpack:\/\//

const cleanRelativePath = (source: string): string => {
  let clean = source.replaceAll('\\', '/')
  clean = clean.replace(/^[a-zA-Z]:\/+/, '')
  clean = clean.replace(/^\/+/, '')
  while (clean.startsWith('../') || clean.startsWith('./')) {
    clean = clean.replace(/^(\.\.\/|\.\/)+/, '')
  }
  while (clean.includes('/../') || clean.includes('/./')) {
    clean = clean.replaceAll('/../', '/')
    clean = clean.replaceAll('/./', '/')
  }
  clean = clean.replace(/\/\.\.$/, '')
  clean = clean.replace(/\/\.$/, '')
  return clean
}

const cleanWebpackUrl = (source: string): string => {
  const parts = source.replace(RE_WEBPACK_URL, '').replace(RE_EXTERNAL_COMMON_JS, commonJsExternalReplace).split('/')
  const cleanParts: string[] = []
  for (const part of parts) {
    if (!part || part === '.') {
      continue
    }
    if (part === '..') {
      if (cleanParts.length > 1) {
        cleanParts.pop()
      }
      continue
    }
    cleanParts.push(part)
  }
  return cleanParts.join('/')
}

export const cleanSource = (source: string): string => {
  if (!source) {
    return ''
  }
  const vscodeIndex = source.indexOf('vscode/')
  if (vscodeIndex !== -1) {
    return source.slice(vscodeIndex + 'vscode/'.length)
  }
  const webpackCleaned = source
    .replace('webpack://markdown-math', 'extensions/markdown-math')
    .replace('webpack://markdown-language-features/./', 'extensions/markdown-language-features/')
    .replace('webpack://markdown-language-features/', 'extensions/markdown-language-features/')
  if (RE_WEBPACK_URL.test(webpackCleaned)) {
    return cleanRelativePath(cleanWebpackUrl(webpackCleaned))
  }
  const cleaned = webpackCleaned
    .replace('out-vscode/vs/workbench/file:/mnt/vss/_work/1/s', '')
    .replace('file:/Users/cloudtest/vss/_work/1/s/', '')
    .replace(RE_RELATIVE_SRC_PATH, 'src/')
    .replace(RE_VS, './src/vs/')
    .replace('../src', 'src')
    .replace('./src', 'src')
    .replace(RE_EXTERNAL_COMMON_JS, commonJsExternalReplace)
  return cleanRelativePath(cleaned)
}
