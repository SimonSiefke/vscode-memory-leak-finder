import assert from 'node:assert'
import type { TestContext } from '../types.js'

export const skip = false

export const requiresNetwork = true

const cardCount = 8
const phases = [1, 2, 3, 4]

const getPhaseLabel = (phase: number): string => `next phase ${phase}`

const getChecksum = (phase: number): string => `next-phase-${phase}-checksum`

const getCardName = (index: number): string => `MetricCard${index}`

const getCardPath = (index: number): string => `next-app/app/components/${getCardName(index)}.js`

const getItemsSource = (phase: number): string => {
  return Array.from({ length: cardCount }, (_, index) => {
    const weight = phase * 25 + index * 3
    return `    {
      id: 'item-${index}',
      label: 'next-phase-${phase}-item-${index}',
      detail: 'detail-${phase}-${index}-${weight}',
      weight: ${weight},
    }`
  }).join(',\n')
}

const getReportDataContent = (phase: number): string => {
  return `export const getPhaseSnapshot = () => ({
  phaseLabel: '${getPhaseLabel(phase)}',
  checksum: '${getChecksum(phase)}',
  summary: 'next-phase-${phase}-summary',
  items: [
${getItemsSource(phase)}
  ],
})
`
}

const getCardContent = (phase: number, index: number): string => {
  return `export function ${getCardName(index)}({ item }) {
  return (
    <article data-card="${index}">
      <h2>next-phase-${phase}-card-${index}</h2>
      <p>{item.label}</p>
      <p>{item.detail}</p>
      <p>{item.weight}</p>
    </article>
  )
}
`
}

const getComponentsIndexContent = (): string => {
  const imports = Array.from({ length: cardCount }, (_, index) => {
    const cardName = getCardName(index)
    return `import { ${cardName} } from './${cardName}'`
  }).join('\n')
  const cards = Array.from({ length: cardCount }, (_, index) => getCardName(index)).join(', ')
  return `${imports}

export const metricCards = [${cards}]
`
}

const getRootLayoutContent = (phase: number): string => {
  return `import { getPhaseSnapshot } from '../lib/report-data'

export const metadata = {
  title: 'next hot reload fixture',
}

export default function RootLayout({ children }) {
  const snapshot = getPhaseSnapshot()

  return (
    <html lang="en">
      <body>
        <header>
          <p>${getPhaseLabel(phase)}</p>
          <p>{snapshot.checksum}</p>
        </header>
        {children}
      </body>
    </html>
  )
}
`
}

const getReportsLayoutContent = (phase: number): string => {
  return `import { getPhaseSnapshot } from '../../lib/report-data'

export default function ReportsLayout({ children }) {
  const snapshot = getPhaseSnapshot()

  return (
    <section>
      <p>next-phase-${phase}-reports-layout</p>
      <p>{snapshot.summary}</p>
      {children}
    </section>
  )
}
`
}

const getReportsTemplateContent = (phase: number): string => {
  return `export default function ReportsTemplate({ children }) {
  return <div data-template="next-phase-${phase}-reports-template">{children}</div>
}
`
}

const getHomePageContent = (phase: number): string => {
  return `import { metricCards } from './components'
import { getPhaseSnapshot } from '../lib/report-data'

export default function HomePage() {
  const snapshot = getPhaseSnapshot()

  return (
    <main>
      <h1>${getPhaseLabel(phase)}</h1>
      <p>{snapshot.summary}</p>
      <p>{snapshot.checksum}</p>
      <section>
        {metricCards.slice(0, 4).map((Card, index) => (
          <Card key={snapshot.items[index].id} item={snapshot.items[index]} />
        ))}
      </section>
    </main>
  )
}
`
}

const getReportsPageContent = (phase: number): string => {
  return `import { metricCards } from '../components'
import { getPhaseSnapshot } from '../../lib/report-data'

export default function ReportsPage() {
  const snapshot = getPhaseSnapshot()

  return (
    <main>
      <h1>next-phase-${phase}-report-page</h1>
      <p>{snapshot.phaseLabel}</p>
      <section>
        {metricCards.map((Card, index) => (
          <Card key={snapshot.items[index].id} item={snapshot.items[index]} />
        ))}
      </section>
    </main>
  )
}
`
}

const getApiRouteContent = (phase: number): string => {
  return `import { getPhaseSnapshot } from '../../../lib/report-data'

export function GET() {
  const snapshot = getPhaseSnapshot()
  return Response.json({
    phase: '${getPhaseLabel(phase)}',
    checksum: snapshot.checksum,
    items: snapshot.items,
  })
}
`
}

const getFilesForPhase = (phase: number): ReadonlyArray<{ name: string; content: string }> => {
  return [
    {
      name: 'next-app/lib/report-data.js',
      content: getReportDataContent(phase),
    },
    {
      name: 'next-app/app/layout.js',
      content: getRootLayoutContent(phase),
    },
    {
      name: 'next-app/app/page.js',
      content: getHomePageContent(phase),
    },
    {
      name: 'next-app/app/reports/layout.js',
      content: getReportsLayoutContent(phase),
    },
    {
      name: 'next-app/app/reports/template.js',
      content: getReportsTemplateContent(phase),
    },
    {
      name: 'next-app/app/reports/page.js',
      content: getReportsPageContent(phase),
    },
    {
      name: 'next-app/app/api/report/route.js',
      content: getApiRouteContent(phase),
    },
    {
      name: 'next-app/app/components/index.js',
      content: getComponentsIndexContent(),
    },
    ...Array.from({ length: cardCount }, (_, index) => ({
      name: getCardPath(index),
      content: getCardContent(phase, index),
    })),
  ]
}

const updatePhase = async (Workspace: TestContext['Workspace'], phase: number): Promise<void> => {
  for (const file of getFilesForPhase(phase)) {
    await Workspace.add(file)
  }
}

const assertBodyContains = async (ExternalRuntime: TestContext['ExternalRuntime'], path: string, expectedText: string): Promise<void> => {
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
  await assertBodyContains(ExternalRuntime, '/', getPhaseLabel(phase))
  await assertBodyContains(ExternalRuntime, '/', `next-phase-${phase}-card-0`)
  await assertBodyContains(ExternalRuntime, '/reports', `next-phase-${phase}-report-page`)
  await assertBodyContains(ExternalRuntime, '/reports', `next-phase-${phase}-reports-layout`)
  await assertBodyContains(ExternalRuntime, '/reports', `next-phase-${phase}-reports-template`)
  await assertBodyContains(ExternalRuntime, '/api/report', getChecksum(phase))
  await assertBodyContains(ExternalRuntime, '/api/report', `next-phase-${phase}-item-${cardCount - 1}`)
}

export const setup = async ({ Editor, Explorer, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
  await ExternalRuntime.startExternalRuntime({
    command: 'node',
    args: [`--inspect=127.0.0.1:${inspectPort}`, 'start-next.cjs', 'dev'],
    cwd: 'next-app',
    setupCommands: [
      {
        command: 'npx',
        args: [
          '--yes',
          'create-next-app@latest',
          'next-app',
          '--yes',
          '--use-npm',
          '--js',
          '--app',
          '--eslint',
          '--no-tailwind',
          '--skip-install',
        ],
      },
      {
        command: 'npm',
        args: ['install', '--package-lock-only'],
        cwd: 'next-app',
      },
      {
        command: 'npm',
        args: ['ci'],
        cwd: 'next-app',
      },
    ],
    setupFiles: [
      ...getFilesForPhase(phases[0]),
      {
        name: 'next-app/app/health/route.js',
        content: `export function GET() {
  return Response.json({ ok: true })
}
`,
      },
      {
        name: 'next-app/start-next.cjs',
        content: `process.env.HOSTNAME = '127.0.0.1'
process.env.NEXT_TELEMETRY_DISABLED = '1'
process.env.PORT = process.env.MEMORY_LEAK_FINDER_SERVER_PORT

require('next/dist/bin/next')
`,
      },
    ],
    inspectPort,
    runtimeName: 'node',
    serverPort,
  })
}

export const run = async ({ ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await updatePhase(Workspace, phases[0])
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
