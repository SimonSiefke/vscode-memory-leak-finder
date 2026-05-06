import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Editor, Electron, Extensions }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'GitHub.copilot-chat',
    name: 'GitHub Copilot Chat',
  })
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  const prompts = [
    { language: 'html', message: 'show me how a hello world html looks like (inline). respond with a single code block only.' },
    { language: 'python', message: 'show me how a hello world python looks like (inline). respond with a single code block only.' },
    { language: 'c', message: 'show me how a hello world c looks like (inline). respond with a single code block only.' },
    { language: 'cpp', message: 'show me how a hello world c++ looks like (inline). respond with a single code block only.' },
    { language: 'java', message: 'show me how a hello world java looks like (inline). respond with a single code block only.' },
    { language: 'erlang', message: 'show me how a hello world erlang looks like (inline). respond with a single code block only.' },
    { language: 'elixir', message: 'show me how a hello world elixir looks like (inline). respond with a single code block only.' },
    { language: 'scala', message: 'show me how a hello world scala looks like (inline). respond with a single code block only.' },
    { language: 'ruby', message: 'show me how a hello world ruby looks like (inline). respond with a single code block only.' },
    { language: 'php', message: 'show me how a hello world php looks like (inline). respond with a single code block only.' },
    { language: 'go', message: 'show me how a hello world go looks like (inline). respond with a single code block only.' },
  ]

  for (const prompt of prompts) {
    await ChatEditor.sendMessage({
      message: prompt.message,
      model: 'GPT-4.1 mini',
      verify: true,
    })

    await ChatEditor.shouldHaveCodeBlockWithLanguage(prompt.language)
  }

  await ChatEditor.scrollToTop()
  await ChatEditor.shouldHaveCodeBlockWithLanguage('html')

  await ChatEditor.scrollToBottom()
  await ChatEditor.shouldHaveCodeBlockWithLanguage('go')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
