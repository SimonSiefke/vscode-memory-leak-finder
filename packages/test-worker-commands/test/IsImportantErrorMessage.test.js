import * as IsImportantError from '../src/parts/IsImportantErrorMessage/IsImportantErrorMessage.js'

test('libgiolibproxy error', () => {
  expect(
    IsImportantError.isImportantErrorMessage(`Failed to load module: /test/snap/code/common/.cache/gio-modules/libgiolibproxy.so`)
  ).toBe(false)
})

test('gpu process error', () => {
  expect(IsImportantError.isImportantErrorMessage(`Exiting GPU process due to errors`)).toBe(false)
})

test('bus error', () => {
  expect(IsImportantError.isImportantErrorMessage(`Failed to connect to the bus`)).toBe(false)
})

test('gpu buffer support error', () => {
  expect(IsImportantError.isImportantErrorMessage(`ERROR:gpu_memory_buffer_support_x11`)).toBe(false)
})

test('oom score error', () => {
  expect(IsImportantError.isImportantErrorMessage(`Failed to adjust OOM score of renderer`)).toBe(false)
})

test('libproxy error', () => {
  expect(IsImportantError.isImportantErrorMessage(`not found (required by /lib/x86_64-linux-gnu/libproxy.so.1)`)).toBe(false)
})
