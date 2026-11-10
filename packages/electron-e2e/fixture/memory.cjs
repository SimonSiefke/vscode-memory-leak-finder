const { app, BrowserWindow, contentTracing } = require('electron')

const retainedNativeBuffers = []
const retainedGpuWindows = []

module.exports = {
  async retainNativeBuffer() {
    retainedNativeBuffers.push(Buffer.alloc(1024 * 1024, 0x5a))
    await new Promise((resolve) => setTimeout(resolve, 100))
  },
  async retainGpuTexture() {
    const window = new BrowserWindow({ show: false, width: 256, height: 256 })
    retainedGpuWindows.push(window)
    await window.loadURL('data:text/html,<canvas id="canvas" width="256" height="256"></canvas>')
    await window.webContents.executeJavaScript(`(() => {
      const gl = document.querySelector('canvas').getContext('webgl')
      if (!gl) throw new Error('GPU positive control requires WebGL')
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(1024 * 1024 * 4).fill(127))
      gl.finish()
      if (gl.getError() !== gl.NO_ERROR) throw new Error('GPU positive-control allocation failed')
      window.retainedGpuControl = { gl, texture }
    })()`)
    await new Promise((resolve) => setTimeout(resolve, 100))
  },
  async idle() {
    await new Promise((resolve) => setTimeout(resolve, 100))
  },
  async memoryEnvironment() {
    // Probe the actual GL implementation, since cached GPU device info can
    // describe the virtual display adapter even when ANGLE uses SwiftShader.
    const window = new BrowserWindow({ show: false })
    let webgl
    try {
      await window.loadURL('data:text/html,<title>GPU capability probe</title>')
      webgl = await window.webContents.executeJavaScript(`(() => {
        const gl = document.createElement('canvas').getContext('webgl')
        if (!gl) return null
        const debug = gl.getExtension('WEBGL_debug_renderer_info')
        return { renderer: gl.getParameter(gl.RENDERER), unmaskedRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null }
      })()`)
    } finally {
      window.destroy()
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    return {
      platform: process.platform,
      webgl,
      versions: process.versions,
      gpuInfo: await app.getGPUInfo('complete'),
      gpuFeatures: app.getGPUFeatureStatus(),
    }
  },
  memoryProcesses() {
    return {
      main: process.memoryUsage(),
      processes: app.getAppMetrics().map(({ pid, type, name, serviceName }) => ({ pid, type, name, serviceName })),
    }
  },
  async captureNativeMemoryTrace(path) {
    await contentTracing.startRecording({
      included_categories: ['disabled-by-default-memory-infra'],
      excluded_categories: ['*'],
      recording_mode: 'record-until-full',
      trace_buffer_size_in_kb: 8192,
      memory_dump_config: { triggers: [{ mode: 'detailed', periodic_interval_ms: 500 }] },
    })
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const usage = await contentTracing.getTraceBufferUsage()
      if (usage.value >= 0.95) throw new Error('Native memory trace buffer filled')
    } finally {
      await contentTracing.stopRecording(path)
    }
    return path
  },
}
