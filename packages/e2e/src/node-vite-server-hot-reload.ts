import assert from 'node:assert'
import type { TestContext } from '../types.js'

export const skip = false

export const requiresNetwork = true

const componentCount = 10
const phases = [1, 2, 3, 4]

const getPhaseLabel = (phase: number): string => `vite phase ${phase}`

const getChecksum = (phase: number): string => `vite-phase-${phase}-checksum`

const getComponentName = (index: number): string => `Segment${index}`

const getComponentPath = (index: number): string => `vite-app/src/generated/components/${getComponentName(index)}.tsx`

const getMetricRows = (phase: number): string => {
  return Array.from({ length: componentCount }, (_, index) => {
    const weight = phase * 100 + index * 7
    return `  {
    id: 'segment-${index}',
    label: 'vite-phase-${phase}-row-${index}',
    weight: ${weight},
    detail: 'trace-${phase}-${index}-${weight}',
  }`
  }).join('\n,')
}

const getMetricsContent = (phase: number): string => {
  return `export const phaseLabel = '${getPhaseLabel(phase)}'
export const phaseChecksum = '${getChecksum(phase)}'
export const metricRows = [
${getMetricRows(phase)}
]
export const metricTotal = ${phase * 1000 + componentCount * 17}
`
}

const getComponentContent = (phase: number, index: number): string => {
  return `import { metricRows, metricTotal, phaseChecksum, phaseLabel } from '../metrics'

export const ${getComponentName(index)} = () => {
  const row = metricRows[${index}]

  return (
    <article data-segment="${index}">
      <h2>vite-phase-${phase}-segment-${index}</h2>
      <p>{phaseLabel}</p>
      <p>{row.label}</p>
      <p>{row.detail}</p>
      <p>{phaseChecksum}</p>
      <p>{metricTotal}</p>
    </article>
  )
}
`
}

const getComponentIndexContent = (phase: number): string => {
  const imports = Array.from({ length: componentCount }, (_, index) => {
    const componentName = getComponentName(index)
    return `import { ${componentName} } from './${componentName}'`
  }).join('\n')
  const componentList = Array.from({ length: componentCount }, (_, index) => getComponentName(index)).join(', ')
  const labels = Array.from({ length: componentCount }, (_, index) => `'vite-phase-${phase}-segment-${index}'`).join(', ')
  return `${imports}

export const segmentComponents = [${componentList}]
export const segmentLabels = [${labels}]
`
}

const getCssContent = (phase: number): string => {
  return `/* vite-phase-${phase}-css */
:root {
  color-scheme: light;
  --phase-accent: hsl(${phase * 35}deg 70% 45%);
  --phase-border: hsl(${phase * 35 + 20}deg 35% 72%);
}

body {
  margin: 0;
}

.app-shell {
  padding: 24px;
  border: 4px solid var(--phase-border);
}
`
}

const getAppContent = (phase: number): string => {
  return `import './generated/root.css'
import { segmentComponents, segmentLabels } from './generated/components'
import { phaseChecksum, phaseLabel } from './generated/metrics'

function App() {
  return (
    <main className="app-shell">
      <h1>{phaseLabel}</h1>
      <p>${getPhaseLabel(phase)}</p>
      <p>{phaseChecksum}</p>
      <p>{segmentLabels.join(' | ')}</p>
      <section>
        {segmentComponents.map((SegmentComponent, index) => (
          <SegmentComponent key={index} />
        ))}
      </section>
    </main>
  )
}

export default App
`
}

const getMainContent = (): string => {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`
}

const getFilesForPhase = (phase: number): ReadonlyArray<{ name: string; content: string }> => {
  return [
    {
      name: 'vite-app/src/main.tsx',
      content: getMainContent(),
    },
    {
      name: 'vite-app/src/App.tsx',
      content: getAppContent(phase),
    },
    {
      name: 'vite-app/src/generated/metrics.ts',
      content: getMetricsContent(phase),
    },
    {
      name: 'vite-app/src/generated/components/index.ts',
      content: getComponentIndexContent(phase),
    },
    {
      name: 'vite-app/src/generated/root.css',
      content: getCssContent(phase),
    },
    ...Array.from({ length: componentCount }, (_, index) => ({
      name: getComponentPath(index),
      content: getComponentContent(phase, index),
    })),
  ]
}

const updatePhase = async (Workspace: TestContext['Workspace'], phase: number): Promise<void> => {
  for (const file of getFilesForPhase(phase)) {
    await Workspace.add(file)
  }
}

const assertResponseContains = async (
  ExternalRuntime: TestContext['ExternalRuntime'],
  path: string,
  expectedText: string,
): Promise<void> => {
  let lastStatus = 0
  let lastBody = ''
  for (let attempt = 0; attempt < 120; attempt++) {
    const separator = path.includes('?') ? '&' : '?'
    const requestPath = `${path}${separator}test=${Date.now()}-${attempt}`
    const response = await ExternalRuntime.request(requestPath)
    lastStatus = response.status
    lastBody = await response.text()
    if (response.ok && lastBody.includes(expectedText)) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  assert.fail(
    `Timed out waiting for ${JSON.stringify(path)} body to contain ${JSON.stringify(expectedText)}. Last status: ${lastStatus}. Last body: ${lastBody}`,
  )
}

const assertPhase = async (ExternalRuntime: TestContext['ExternalRuntime'], phase: number): Promise<void> => {
  await assertResponseContains(ExternalRuntime, '/src/main.tsx', "createRoot(document.getElementById('root')!)")
  await assertResponseContains(ExternalRuntime, '/src/App.tsx', getPhaseLabel(phase))
  await assertResponseContains(ExternalRuntime, '/src/generated/metrics.ts', getChecksum(phase))
  await assertResponseContains(ExternalRuntime, '/src/generated/components/index.ts', `vite-phase-${phase}-segment-${componentCount - 1}`)
  await assertResponseContains(ExternalRuntime, '/src/generated/root.css', `vite-phase-${phase}-css`)
  for (let index = 0; index < componentCount; index++) {
    await assertResponseContains(
      ExternalRuntime,
      `/src/generated/components/${getComponentName(index)}.tsx`,
      `vite-phase-${phase}-segment-${index}`,
    )
  }
}

export const setup = async ({ Editor, Explorer, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
  await ExternalRuntime.startExternalRuntime({
    command: 'node',
    args: [
      `--inspect=127.0.0.1:${inspectPort}`,
      './node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      String(serverPort),
      '--strictPort',
    ],
    cwd: 'vite-app',
    healthPath: '/health.txt',
    setupCommands: [
      {
        command: 'npx',
        args: ['--yes', 'create-vite@latest', 'vite-app', '--template', 'react-ts'],
      },
      {
        command: 'npm',
        args: ['install', '--package-lock-only'],
        cwd: 'vite-app',
      },
      {
        command: 'npm',
        args: ['ci'],
        cwd: 'vite-app',
      },
    ],
    setupFiles: [
      ...getFilesForPhase(phases[0]),
      {
        name: 'vite-app/public/health.txt',
        content: 'ok\n',
      },
    ],
    inspectPort,
    runtimeName: 'node',
    serverPort,
  })
}

export const run = async ({ ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await assertPhase(ExternalRuntime, phases[0])

  for (const phase of phases.slice(1)) {
    await updatePhase(Workspace, phase)
    await assertPhase(ExternalRuntime, phase)
  }
}

export const teardown = async ({ Editor, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
