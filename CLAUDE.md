# CLAUDE.md

> Guidance for AI assistants (Claude Code, CodeRabbit, etc.) working in this repo. Read this **before** scanning the codebase. Follow it strictly.

This file is the source of truth for **how we work** in `mail-web`. CodeRabbit also reads it during PR reviews, so any rule here applies to both code generation and code review.

---

## Communication style

- **Get straight to the point.** No filler, no recaps of what the user just said.
- Lead with the answer or the action, then (only if needed) a short justification.
- Prefer short, direct sentences over long explanations.
- Don't summarize diffs at the end of a response — the user can read them.

---

## Project at a glance

- **Stack:** React 19 + TypeScript, Vite, Redux Toolkit (+ RTK Query), TailwindCSS v4, Vitest, react-router v7, i18next, Tiptap, IndexedDB (via `idb`).
- **Node:** `>= 24`. Package manager: **npm only** (enforced by `scripts/check-package-manager.js`).
- **Internal SDKs:** `@internxt/sdk`, `@internxt/ui`, `@internxt/lib`, `@internxt/css-config`, `internxt-crypto`.
- **Path alias:** `@/*` → `src/*` (configured in `vite.config.ts` and `vitest.config.ts`).

### Scripts

| Command                     | Purpose                          |
| --------------------------- | -------------------------------- |
| `npm run dev`               | Vite dev server on port 3001     |
| `npm run build`             | Type-check + production build    |
| `npm run lint` / `lint:fix` | ESLint                           |
| `npm run format`            | Prettier                         |
| `npm test`                  | Vitest (run once)                |
| `npm run test:ui`           | Vitest UI                        |
| `npm run test:coverage`     | Coverage report (istanbul, lcov) |

---

## Folder layout (where things go)

**Don't scan the whole tree to decide placement.** Use this map.

```
src/
├── assets/              # Static files (images, fonts, svgs)
├── components/          # Shared, reusable UI components (grouped by feature: compose-message/, preferences/, Sidenav/, …)
├── context/             # React contexts (dialog-manager, theme)
├── errors/              # Custom Error classes, grouped by domain (config, database, mail, oauth, storage, shared, navigation)
├── features/            # Feature modules (identity-setup, mail, welcome). Each is self-contained.
├── hooks/               # Custom React hooks, grouped by domain (auth, mail, navigation, preferences)
├── i18n/                # Translations (locales/), provider, service, types
├── routes/              # Route definitions (paths/), guards/, layouts/
├── services/            # Singletons + API clients (config, database, sdk, oauth, local-storage, error, notifications, navigation, date, search, user)
├── store/               # Redux store: slices/, api/ (RTK Query), hooks.ts, index.ts
├── test-utils/          # setup.ts, fixtures.ts, createTestStore.ts
├── types/               # Shared TS types, grouped by domain (config, mail, oauth, preferences)
├── utils/               # Pure utility functions, one folder per util
├── App.tsx
├── main.tsx
└── constants.ts         # App-wide constants (URLs, limits, defaults)
```

### Placement rules

- **New feature** (a page/flow with multiple components) → [src/features/](src/features/)`<feature>/`, with `index.tsx` entry and a `components/` subfolder.
- **Reusable component** used by multiple features → [src/components/](src/components/)`<name>/`.
- **Logic used only by one component** → a hook inside the feature's `hooks/` subfolder, or a local `use<Name>.ts` next to the component.
- **Logic reused across features** → [src/hooks/](src/hooks/)`<domain>/use<Name>.ts`.
- **API call / external integration / singleton** → [src/services/](src/services/)`<domain>/`.
- **Redux slice** → [src/store/slices/](src/store/slices/)`<name>/`. Thunks go in a `thunks/` subfolder, one file per thunk.
- **RTK Query endpoint** → [src/store/api/](src/store/api/)`<domain>/`.
- **Custom error class** → [src/errors/](src/errors/)`<domain>/index.ts`, then re-export from [src/errors/index.ts](src/errors/index.ts).
- **Shared types** → [src/types/](src/types/)`<domain>/index.ts`. Types used in a single file stay inline.
- **Pure utility** → [src/utils/](src/utils/)`<name>/index.ts` + co-located `<name>.test.ts`.
- **Constant** → [src/constants.ts](src/constants.ts) if app-wide. Domain constants go inside the domain folder.
- **Route** → add a `RouteConfig` entry in [src/routes/paths/index.ts](src/routes/paths/index.ts).

---

## Architecture rules

### Components must be dumb

Components render. Hooks think. **Always extract logic into a hook** unless the component has essentially no logic.

- State, effects, event handlers, data fetching → live in a `use<Feature>` hook.
- The component receives data + callbacks from the hook and renders JSX.
- This separation makes the logic testable without rendering the DOM and keeps components easy to refactor.

```tsx
// Good
const useUpdateEmail = ({ onNext }) => {
  const [username, setUsername] = useState('');
  const [domain, setDomain] = useState<Domain>('@inxt.me');
  const handleConfirm = () => onNext(`${username}${domain}`);
  return { username, setUsername, domain, setDomain, handleConfirm };
};

export const UpdateEmail = (props) => {
  const { username, setUsername, domain, setDomain, handleConfirm } = useUpdateEmail(props);
  return (/* JSX only */);
};
```

### Services are singletons

Follow the existing pattern:

```ts
export class FooService {
  public static readonly instance: FooService = new FooService();
  // methods...
}
```

Use `FooService.instance.method()` from callers. This is what [MailService](src/services/sdk/mail/index.ts), [ConfigService](src/services/config/index.ts), etc. do.

### State management

- **Server state** → RTK Query in [src/store/api/](src/store/api/).
- **Client/session state** → Redux slices in [src/store/slices/](src/store/slices/).
- **Local UI state** → `useState` inside the hook (not the component).
- **Cross-tree UI state** → React Context in [src/context/](src/context/) (dialogs, theme).
- Always use the typed hooks: `useAppDispatch`, `useAppSelector` from [src/store/hooks.ts](src/store/hooks.ts).

### Environment variables

- **All env vars go in `.env`.** No hardcoded secrets or URLs that differ between environments.
- Prefix with `VITE_` so Vite exposes them to the client.
- Always access them through [ConfigService](src/services/config/index.ts) (`ConfigService.instance.getVariable('KEY')`), never `import.meta.env` directly outside that service.
- When adding a new variable:
  1. Add it to [.env.example](.env.example).
  2. Add its key to the `ConfigKeys` type in [src/types/config/](src/types/config/).
  3. Add the mapping in `configKeys` in [src/services/config/index.ts](src/services/config/index.ts).

### Errors

- Throw typed errors from [src/errors/](src/errors/) (see `VariableNotFoundError`, `UserNotFoundError` as templates).
- User-facing errors go through `ErrorService.instance.notifyUser(...)` or `notificationsService.show(...)`.
- Translate error messages via the i18n `translate('errors.<domain>.<key>')` pattern.

---

## Testing rules

We test to catch regressions in **behavior**, not to check that code was written.

### Scope

- **Test every `.ts` file that contains logic.** Services, hooks, utils, slices, thunks, RTK Query endpoints, guards — all required.
- **Don't test components** (`.tsx` with only rendering). If a component has testable logic, that logic should already be in a hook — test the hook.
- Test files are co-located: `foo.ts` → `foo.test.ts` (or `.test.tsx` for hooks using `renderHook`).

### Structure: AAA (Arrange, Act, Assert)

Every test follows three blank-line-separated sections:

```ts
test('When the user is not authenticated, then it should redirect to welcome', async () => {
  // Arrange
  const store = createTestStore({ user: { isAuthenticated: false } });
  const navigateSpy = vi.spyOn(NavigationService.instance, 'navigate');

  // Act
  renderHook(() => useAuthGuard(), { wrapper: createWrapper(store) });

  // Assert
  expect(navigateSpy).toHaveBeenCalledWith({ id: AppView.Welcome });
});
```

### Naming & descriptions

Describe **behavior in plain language**, not implementation.

- Pattern: `When <situation>, then <expected outcome>`.
- **No variable names, function names, or types** in the description. If a variable is renamed, the test description should still read correctly.
- Bad: `'returns true when isUserAuthed flag is set'`
- Good: `'When the user is authenticated, then it should allow access'`
- Use nested `describe` blocks for grouping by scenario/feature (see [useAuth.test.tsx](src/hooks/auth/useAuth.test.tsx)).

### What to test

- Test the **purpose** of the code: "this function exists to do X — does it do X under normal and edge conditions?"
- Cover: happy path, realistic edge cases, error/rejection paths, boundary values.
- **Don't** test TypeScript types, private fields, or internal structure. If you can't observe it from outside, it's not worth testing.
- **Don't** write tests that just mirror the implementation ("function calls X then Y then Z") — those break on every refactor without catching bugs.

### Tools

- **Vitest** with `globals: true`, `jsdom` environment, `TZ: UTC`.
- **Setup:** [src/test-utils/setup.ts](src/test-utils/setup.ts).
- **Fixtures:** [src/test-utils/fixtures.ts](src/test-utils/fixtures.ts) (`getMockedUser`, `getMockedTier`, etc., built with `@faker-js/faker`).
- **Store for tests:** `createTestStore` from [src/test-utils/createTestStore.ts](src/test-utils/createTestStore.ts).
- **Hooks:** `renderHook` + `act` from `@testing-library/react`.
- **IndexedDB:** `fake-indexeddb/auto`.
- Reset mocks in `beforeEach` with `vi.restoreAllMocks()`.

---

## Adding dependencies

Default answer: **don't add one**. Justify it first.

Before proposing a new package, answer in the PR/commit:

1. **What problem does it solve** that the existing stack (React, Redux Toolkit, Tailwind, `@internxt/ui`, Tiptap, dayjs, axios, idb, i18next) can't?
2. **Can we write it ourselves in ≤ ~100 LOC** with comparable quality? If yes, prefer that — one less supply-chain risk, one less thing to update.
3. **Maintenance status:** recent releases, open issues, TypeScript support, bundle size.
4. **License:** must be compatible with our project.

Add it only when the cost of writing/maintaining the equivalent ourselves is clearly higher than the cost of the dependency. "It's simpler with a library" is not enough on its own — needs real complexity to justify it.

---

## Code quality principles

- **Scalable, but not over-engineered.** Build what solves today's problem cleanly. Don't design for hypothetical future requirements.
- **Easy to maintain and refactor.** Prefer clear names, small functions, narrow responsibilities.
- **No premature abstractions.** Three similar lines are fine — extract on the third repetition with real divergence, not the second.
- **No speculative error handling.** Validate at system boundaries (user input, external APIs). Trust internal code.
- **Don't touch code you don't need to change.** No drive-by refactors, no "while I'm here" cleanups. Keep diffs focused.
- **Comments only where logic isn't self-evident.** Don't restate the code in words. JSDoc on service public methods (see [MailService](src/services/sdk/mail/index.ts)) is fine.
- **i18n always.** No hardcoded user-facing strings — use `translate(...)` with keys in [src/i18n/locales/](src/i18n/locales/).

---

## Before finishing a task

1. `npm run lint` clean.
2. `npm test` passes — including new tests for any `.ts` logic added.
3. New env vars documented in `.env.example`.
4. No unused imports, no dead code, no `console.log` left over.
5. i18n keys added in **all locales** (`en`, `es`, `fr`, `it`) if you added a user-facing string.

---

## For CodeRabbit specifically

When reviewing PRs, enforce the rules above. In particular:

- Flag components that hold non-trivial logic (should be in a hook).
- Flag `.ts` logic files without corresponding `.test.ts`.
- Flag tests whose descriptions reference variable/function/type names instead of behavior.
- Flag tests that don't follow AAA structure.
- Flag new dependencies without justification in the PR description.
- Flag direct `import.meta.env` usage outside `ConfigService`.
- Flag hardcoded user-facing strings (should go through i18n).
- Flag missing translations (new key in `en.json` but not in the other locales).
