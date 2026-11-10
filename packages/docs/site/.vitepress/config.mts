import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'en-US',
  title: 'VS Code Memory Leak Finder',
  description: 'A field guide to measuring memory, resources, and performance in VS Code.',
  base: '/vscode-memory-leak-finder/docs/',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    siteTitle: 'Memory Leak Finder',
    nav: [
      { text: 'Guide', link: '/guide/overview' },
      { text: 'Measures', link: '/measures/' },
      { text: 'Reports', link: '/reports' },
      { text: 'GitHub', link: 'https://github.com/SimonSiefke/vscode-memory-leak-finder' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Start here',
          items: [
            { text: 'Project overview', link: '/guide/overview' },
            { text: 'Quick start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'How it works',
          items: [
            { text: 'Execution flow', link: '/guide/execution-flow' },
            { text: 'Scenarios', link: '/guide/scenarios' },
          ],
        },
      ],
      '/measures/': [
        {
          text: 'Measure catalog',
          items: [
            { text: 'All measures', link: '/measures/' },
            { text: 'Event loop delay', link: '/measures/event-loop-delay' },
            { text: 'Forced layout count', link: '/measures/forced-layout-count' },
            { text: 'Long renderer tasks', link: '/measures/long-renderer-tasks' },
            { text: 'Module resolution', link: '/measures/module-resolution' },
            { text: 'Module resolution lookups', link: '/measures/module-resolution-lookups' },
            { text: 'Synchronous DOM read count', link: '/measures/synchronous-dom-read-count' },
            { text: 'Synchronous DOM read count with stack traces', link: '/measures/synchronous-dom-read-count-with-stack-traces' },
            { text: 'Synchronous file system', link: '/measures/synchronous-file-system' },
            { text: 'Tracked allocation bytes', link: '/measures/tracked-allocation-bytes' },
          ],
        },
      ],
      '/scenarios/': [
        {
          text: 'Scenarios',
          items: [
            { text: 'Accessibility marker signals', link: '/scenarios/accessibility-marker-signals' },
            { text: 'Edit telemetry document snapshots', link: '/scenarios/edit-telemetry-document-snapshots' },
            { text: 'Markdown editing', link: '/scenarios/markdown-editing' },
            { text: 'Python development', link: '/scenarios/python-development' },
          ],
        },
      ],
    },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/SimonSiefke/vscode-memory-leak-finder' }],
    editLink: {
      pattern: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/edit/main/packages/docs/site/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
