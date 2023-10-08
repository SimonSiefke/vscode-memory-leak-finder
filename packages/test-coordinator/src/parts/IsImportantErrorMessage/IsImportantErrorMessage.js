const RE_LIB_GIO_PROXY_ERROR = /Failed to load module: .*libgiolibproxy.so/
const RE_LIB_PROXY_NOT_FOUND = /not found \(required by .*libproxy.so/

export const isImportantErrorMessage = (data) => {
  if (data.includes('Failed to connect to the bus')) {
    return false
  }
  if (data.includes('Exiting GPU process due to errors')) {
    return false
  }
  if (data.includes('ERROR:gpu_memory_buffer_support_x11')) {
    return false
  }
  if (data.includes('Failed to adjust OOM score of renderer')) {
    return false
  }
  if (data.includes('Failed to decrypt: Key not valid for use in specified state')) {
    return false
  }
  if (data.includes(`For help, see: https://nodejs.org/en/docs/inspector`)) {
    return false
  }
  if (data.trim() === 'Debugger attached.') {
    return false
  }
  if (data.includes(`Failed to call method: org.freedesktop.portal.Settings.Read: object_path= /org/freedesktop/portal/desktop`)) {
    return false
  }
  if (RE_LIB_PROXY_NOT_FOUND.test(data)) {
    return false
  }
  if (RE_LIB_GIO_PROXY_ERROR.test(data)) {
    return false
  }
  return true
}
