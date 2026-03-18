# Mail web

Here lives the repo of Internxt Mail (Web)

## Tech Stack

- **React** with **TypeScript**
- **Vite** as build tool and dev server
- **CodeRabbit** for AI-powered code review

## Getting Started

### Prerequisites

- Node.js >= 24

### Installation

```bash
git clone <repository-url>
cd mail-web
npm install
```

Then, add the correct environment variables (using the .env.example)

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Project Structure

```text
src/
├── assets/          # Static assets (images, fonts, icons)
├── components/      # Shared, reusable UI components
├── features/        # Self-contained feature modules
├── hooks/           # Custom React hooks
├── services/        # Services (API clients, singletons)
├── routes/          # Route definitions and configuration
├── store/           # Global state management
├── i18n/            # Internationalization and translations
└── types/           # Shared TypeScript type definitions
```
