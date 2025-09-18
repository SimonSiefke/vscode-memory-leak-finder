# Build Package

This package contains build utilities for the vscode-memory-leak-finder project.

## API Type Generation

The build package includes functionality to generate TypeScript declaration files for the page-object API used in e2e tests.

### Usage

To generate API types for the page-object API:

```bash
# From the root directory
npm run generate-api-types

# Or from the build package directory
cd packages/build
npm run generate-api-types
```

### What it does

The type generation creates a comprehensive TypeScript declaration file at `packages/e2e/types/pageobject-api.d.ts` that includes:

- Type definitions for all page-object components (Editor, Workbench, Workspace, etc.)
- Method signatures with proper parameter types
- Return types for all async methods
- Interface definitions for the main PageObjectApi

### Benefits

- **Type Safety**: E2e tests now have proper TypeScript type checking
- **IntelliSense**: Better IDE support with autocomplete and error detection
- **Documentation**: Types serve as living documentation of the API
- **Refactoring**: Safer refactoring with compile-time error detection

### Generated Files

- `packages/e2e/types/pageobject-api.d.ts` - Main type definitions
- `packages/e2e/types.d.ts` - Updated to export the generated types

The generated types are automatically imported in the e2e package's `types.d.ts` file, making them available to all e2e test files.
