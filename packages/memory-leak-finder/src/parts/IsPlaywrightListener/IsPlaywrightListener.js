const PLAYWRIGHT_DESCRIPTION_1 =
  '(event) => {\n      var _a;\n      return (_a = this._hitTargetInterceptor) == null ? void 0 : _a.call(this, event);\n    }'
const PLAYWRIGHT_TYPE_1 = `__playwright_global_listeners_check__`

export const isPlaywrightListener = (listener) => {
  return listener.description === PLAYWRIGHT_DESCRIPTION_1 || listener.type === PLAYWRIGHT_TYPE_1
}
