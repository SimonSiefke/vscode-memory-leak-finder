# Mock Chat Provider Extension

This extension registers a mock chat provider for VS Code, allowing e2e tests of chat functionality without requiring Copilot or external services.

## Usage

- Build the extension: `npm run build`
- Package and install it in your test VS Code instance.
- The provider will echo any prompt sent to it, simulating chat responses.

## Development

- Source code is in `src/extension.ts`.
- Modify the response logic to simulate different chat scenarios for your tests.
