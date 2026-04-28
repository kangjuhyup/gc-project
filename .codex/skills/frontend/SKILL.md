---
name: frontend
description: Frontend 설계, 구현, 테스트를 위한 프로젝트 스킬. Use when Codex needs to plan UI/UX, implement screens/components/styles/client state/API integration, improve accessibility or responsiveness, run frontend checks, or review frontend behavior in this project. This project uses Vite with ES modules, shadcn/ui for UI primitives, TanStack Query for server state, Zustand for client/UI state only, a single API client module, and Vitest with happy-dom tests under ui/test.
---

# Frontend Skill

## Goal

Deliver frontend work that is usable, consistent with the existing app, accessible, responsive, and verified through the closest available feedback loop.

## Stack Rules

- Use Vite with ES modules only.
- Use `import.meta.env` for environment variables and require the `VITE_` prefix for client-exposed values.
- Never expose secrets through frontend environment variables. Never store client secrets in UI code.
- Do not use Node-specific APIs in browser client code.
- Do not use CommonJS imports.
- Use React with strict TypeScript.
- Use functional components only.
- Keep components small and reusable. Avoid god components.
- Use shadcn/ui as the default component foundation for forms, dialogs, buttons, menus, tabs, tables, toasts, and other common UI primitives.
- Use the project's existing shadcn/ui wrapper components and variants before creating custom components.
- Use TanStack Query for all API communication and server state: fetching, mutations, caching, invalidation, retries, loading/error states, and optimistic updates.
- Use Zustand for client state that is not server-owned: UI preferences, wizard state, ephemeral selections, local drafts, and cross-component client-only state.
- Do not manage server state with `useEffect + fetch`.
- Centralize query key factories in `queryKeys.ts`.
- Invalidate related queries after successful mutations.
- Do not put server-owned data in Zustand when TanStack Query can own it.
- Do not duplicate TanStack Query cache data into component state or Zustand unless there is a deliberate derived/local editing reason.
- Keep feature-local state in component state when it does not need cross-component access.

## Networking Rules

- Use a single API client module at `src/lib/apiClient.ts`.
- Route all API calls through the API client and TanStack Query hooks.
- Attach a correlationId to API requests according to the existing project convention.
- Handle `401` and `403` globally in the API client or the established auth boundary.
- Keep API client code browser-safe: no Node-only APIs, no CommonJS, no secrets.

## Zustand Rules

Allowed Zustand state:

- UI state such as modal, tab, toggle, drawer, and popover state.
- Wizard state before submit.
- Local settings such as theme and filter preferences.

Forbidden Zustand state:

- Server-authoritative data.
- Duplicated TanStack Query cache data.
- Client secrets or other sensitive server credentials.

## 설계

- Inspect the existing frontend stack, routes, component patterns, styling system, state management, and API boundaries before proposing structure.
- Identify the target user workflow first: entry point, primary action, empty/loading/error states, success state, and recovery path.
- Prefer existing shadcn/ui components, design tokens, icons, layout primitives, form patterns, TanStack Query hooks, and Zustand stores.
- Decide state ownership before implementation: TanStack Query for remote data, Zustand for shared client-only state, component state for local interaction state.
- Keep application screens work-focused. Avoid marketing-style hero sections unless the requested surface is explicitly a landing page.
- Define responsive behavior for mobile, tablet, and desktop. Ensure text, buttons, tables, dialogs, and toolbars do not overlap or shift unexpectedly.
- Include accessibility requirements in the design: semantic HTML, labels, keyboard flow, focus state, contrast, and reduced-motion handling where relevant.

## 구현

- Make the smallest coherent change that completes the user workflow end to end.
- Reuse existing shadcn/ui components before creating new ones. Add abstractions only when they remove real duplication or match an established local pattern.
- Keep UI state explicit: loading, disabled, optimistic, validation, empty, unauthorized, not found, and failure states.
- Use `src/lib/apiClient.ts` and TanStack Query hooks for API communication. Do not duplicate request logic.
- Model mutations with TanStack Query mutation hooks and invalidate or update affected queries deliberately.
- Keep query keys stable, specific, and produced by centralized factories in `queryKeys.ts`.
- Use Zustand stores for shared client state only. Keep stores small, typed, and action-oriented.
- Avoid mixing business/domain server rules into Zustand stores; keep server validation and persistence behavior in API/application flows.
- Keep visual polish grounded in the product domain: restrained spacing, predictable navigation, stable dimensions, and readable hierarchy.
- Use icons from the existing icon library when available. Prefer icon buttons for familiar actions and provide accessible labels or tooltips.
- Avoid unrelated refactors, broad restyling, and churn in generated files.

## 테스트

- Use Vitest with `happy-dom`, not jsdom, because of ESM compatibility.
- Configure tests in `ui/vite.config.ts` with `test.environment: 'happy-dom'`.
- Put tests under `ui/test/`. Do not put frontend tests under `ui/src/test/`.
- Use `ui/test/setup.ts` for shared setup, including `afterEach` cleanup with `localStorage.clear()` and `vi.clearAllMocks()`.
- Run the fastest relevant static checks first: typecheck, lint, formatting, and targeted Vitest suites when configured.
- Prioritize tests in this order: `lib/` (`apiClient`, `queryKeys`), `stores/` (Zustand), `validation/` (form regex and rule differences), then `hooks/` (mutation success/failure callbacks when needed).
- Do not unit-test full page component rendering; treat that as integration coverage.
- Do not test `mockApi.ts` as production behavior.
- Run targeted unit or integration tests for changed shadcn/ui compositions, TanStack Query hooks, Zustand stores, routing, and API behavior.
- Verify TanStack Query loading, error, success, invalidation, and mutation behavior for changed data flows.
- Verify Zustand store actions and selectors when client state behavior changes.
- Use `vi.stubGlobal('fetch', vi.fn())` for fetch mocks and `vi.stubGlobal('location', { href: '' })` for location mocks.
- After using `vi.stubGlobal`, include `afterEach(() => vi.unstubAllGlobals())`.
- Put `vi.mock()` calls at file top level because Vitest hoists them.
- Initialize Zustand store tests with `store.setState()` and assert with `store.getState()`.
- For visual or interaction changes, start the dev server when appropriate and verify the workflow in a browser at representative desktop and mobile viewports.
- Check keyboard-only operation for dialogs, menus, forms, and primary workflows.
- Confirm edge states manually when tests do not cover them: loading, empty data, validation errors, server errors, and permission failures.
- Report any checks that could not be run and the residual risk.

## Checklist

- [ ] Vite client code uses ES modules only and no CommonJS imports.
- [ ] Environment variables use `import.meta.env` and only `VITE_` prefixed client values.
- [ ] No secrets or client secrets are exposed or stored in UI code.
- [ ] shadcn/ui components and variants are reused where appropriate.
- [ ] Server state is owned by TanStack Query, not `useEffect + fetch`, component state, or Zustand.
- [ ] Shared client-only state is modeled with Zustand only when component state is insufficient.
- [ ] API calls go through `src/lib/apiClient.ts`.
- [ ] API requests attach correlationId and handle `401`/`403` globally.
- [ ] Query keys, invalidation, mutation states, and error states are handled deliberately.
- [ ] Loading, empty, validation, success, and failure UI states are visible and tested or manually verified.
- [ ] Keyboard accessibility and responsive layout are checked for changed interactive UI.
- [ ] Tests live under `ui/test/`, not `ui/src/test/`.
- [ ] Vitest uses `happy-dom`.
- [ ] `fetch` and `location` mocks use `vi.stubGlobal` with `afterEach` unstub cleanup.
