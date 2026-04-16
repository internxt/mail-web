[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=internxt_mail-web&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=internxt_mail-web)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=internxt_mail-web&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=internxt_mail-web)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=internxt_mail-web&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=internxt_mail-web)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=internxt_mail-web&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=internxt_mail-web)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=internxt_mail-web&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=internxt_mail-web)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=internxt_mail-web&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=internxt_mail-web)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=internxt_mail-web&metric=coverage)](https://sonarcloud.io/summary/new_code?id=internxt_mail-web)

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

