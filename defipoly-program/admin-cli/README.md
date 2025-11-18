# Defipoly Admin CLI

A clean, modular admin CLI for managing Defipoly game operations.

## Structure

```
admin-cli/
├── commands/           # Individual command implementations
│   ├── grant-property.ts
│   ├── revoke-property.ts
│   ├── grant-shield.ts
│   ├── update-cooldown.ts
│   ├── emergency-withdraw.ts
│   ├── transfer-authority.ts
│   ├── close-player-account.ts
│   └── index.ts
├── menu/              # Menu system
│   ├── menu-handler.ts
│   └── menu-display.ts
├── utils/             # Utility functions
│   ├── validation.ts
│   ├── pda.ts
│   ├── program.ts
│   └── input.ts
├── config.ts          # Configuration
├── types.ts           # Type definitions
└── index.ts           # Main entry point
```

## Usage

Run the CLI with:

```bash
npx tsx admin-cli/index.ts
```

Or from the admin-cli directory:

```bash
npm run dev
```

## Features

- **Modular Design**: Each command is in its own file for easy maintenance
- **Type Safety**: Full TypeScript support with proper types
- **Interactive Menu**: Clean, user-friendly interface
- **Input Validation**: Robust validation for all user inputs
- **Error Handling**: Comprehensive error handling and user feedback
- **Configuration**: Centralized configuration management