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
      '/measures/': [{ text: 'Measure catalog', items: [{ text: 'All measures', link: '/measures/' }] }],
    },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/SimonSiefke/vscode-memory-leak-finder' }],
    editLink: {
      pattern: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/edit/main/packages/docs/site/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
