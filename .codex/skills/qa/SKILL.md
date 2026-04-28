---
name: qa
description: QA 설계, 구현, 테스트를 위한 프로젝트 스킬. Use when Codex needs to create a test strategy, write or improve automated tests, perform regression testing, verify bug fixes, design acceptance criteria, investigate flaky tests, or report quality risks in this project. This project requires backend tests in domain-first order, isolated unit tests without NestJS module loading, mocked external services, projection idempotency checks, security flow coverage, and coverage thresholds.
---

# QA Skill

## Goal

Provide practical quality assurance that proves the requested behavior, protects nearby regressions, and communicates remaining risk clearly.

## Backend QA Ownership

- Test code is mandatory for every backend production code change. Do not finish after implementation only.
- When invoked after backend work, use the backend handoff note to identify changed files, changed behavior, affected contracts, and risk areas.
- Add or update tests for success paths, validation failures, authorization failures, not-found cases, conflict/idempotency behavior, and persistence effects.
- Run targeted backend tests for changed services, routes, repositories, migrations, and integrations.
- After writing the relevant tests, run regression tests before reporting completion.
- Verify migrations against the configured test database when database schema changes are included.
- Prefer integration or e2e tests when the change crosses API, database, authentication, or external-service boundaries.
- Use mocks/fakes for unstable external systems unless the project already has reliable local containers or contract tests.
- Check architecture constraints before finishing: domain has no framework imports, DTOs use `private constructor` plus `static of()`, ports are application interfaces, adapters are infrastructure implementations, and controllers delegate only to handlers.
- Report commands run, important failures, and any checks that could not be executed.

## Backend Test Order

Write backend tests in this order:

1. Domain tests, pure TypeScript: verify aggregate invariants and emitted events.
2. Command handler tests: mock Repository and EventBus ports.
3. Query handler tests: verify read model mapping.
4. Integration/E2E tests: verify provider endpoints and key flows.

Prefer domain tests first as the TDD entry point. Do not mock domain logic; exercise the real aggregate/value object/domain service behavior directly.

## Isolation Rules

- Write unit tests without NestJS module loading.
- Replace external services with mocks.
- For external service calls, verify whether the call happened. Do not over-specify payload details unless the payload is itself part of the contract under test.
- Never mock domain logic.
- Keep command/query handler tests at the application boundary by mocking ports, not infrastructure implementations.
- Keep integration/E2E tests for provider endpoints, persistence wiring, and cross-layer key flows.

## Korean Test Descriptions

- Every test case must include a Korean behavior description in the test name or an adjacent test comment.
- Prefer Korean `it(...)` descriptions that state the expected behavior from the user's perspective.
- Keep descriptions specific: include the condition, action, and expected result when that improves readability.
- Avoid vague names such as `works`, `success`, `failure`, or implementation-only names without a Korean explanation.
- If a technical English term is clearer, keep it inside the Korean sentence.

Example:

```typescript
it('이미 인증된 휴대전화번호로 회원가입하면 회원을 생성한다', () => {
  // ...
});
```

## Coverage Rules

- Security-critical domain code must have at least 90% coverage.
- Overall backend coverage must be at least 85%.
- Include security tests for redirect URI validation, PKCE behavior, and other auth/OIDC invariants touched by the change.
- Include projection idempotency tests when projections, events, read models, or event handlers are changed.

## Test Data Libraries

Use the project-approved test data libraries when writing tests that need generated values or reusable fixtures:

- Use `@faker-js/faker` for realistic generated values such as IDs, names, emails, addresses, dates, UUIDs, and strings.
- Use `fishery` for typed fixture factories for domain objects, DTO params, command params, read models, and API response fixtures.
- Use `fast-check` for property-based tests of pure logic, validators, mappers, value objects, and boundary-heavy domain rules.

Keep generated data deterministic:

- Prefer explicit fixed values for behavior that must be easy to read or debug.
- Seed Faker in test setup or inside the test when generated values are used.
- Keep factory defaults stable and override only the fields relevant to the scenario.
- For `fast-check`, pin or report the failing seed when a property test fails.
- Do not use random generation to hide unclear requirements; encode important cases as named examples.

## 설계

- Start from the user-visible requirement or defect: expected behavior, affected users, scope, environments, and acceptance criteria.
- Map the risk surface: changed files, touched workflows, dependencies, data states, permissions, browsers/devices, and failure modes.
- Choose the cheapest reliable test level for each risk: unit, component, integration, contract, e2e, migration, accessibility, performance, or manual exploratory check.
- Prefer focused regression coverage around the changed behavior over broad brittle scenarios.
- Define test data deliberately: normal, empty, boundary, invalid, duplicate, unauthorized, expired, and concurrent cases when relevant.
- Use `@faker-js/faker`, `fishery`, and `fast-check` according to the Test Data Libraries section when generated data or factories improve coverage clarity.
- Identify what should be automated now and what is better handled as a manual exploratory note.

## 구현

- Follow the existing test framework, fixture factories, page objects, mocks, naming, and assertion style.
- Keep tests deterministic: avoid real time, random data, network dependency, hidden shared state, and order coupling unless controlled by fixtures.
- Assert observable behavior and meaningful state changes instead of implementation details.
- Write Korean behavior descriptions for every test case so the intent is understandable during review.
- For backend work, write domain tests first, then command handler tests, query handler tests, and integration/E2E tests as needed.
- Build reusable backend test fixtures with `fishery` when multiple tests need the same shape.
- Generate realistic but controlled scalar values with `@faker-js/faker`; seed or override values when assertions depend on them.
- Use `fast-check` only for properties that should hold across many inputs, not as a replacement for clear example-based tests.
- Mock external dependencies and application ports. Do not mock domain behavior.
- Avoid unit tests that require NestJS module bootstrapping.
- When fixing a bug, write a failing regression test first when practical, then implement or verify the fix.
- Keep test setup readable. Extract helpers only when they make multiple tests clearer.
- For flaky tests, isolate the nondeterministic condition, reduce timing assumptions, and prefer explicit waits for observable state.

## 테스트

- Run the narrowest relevant test command first, then expand to affected suites when confidence is still low.
- For frontend QA, include browser verification for critical workflows, responsive layouts, keyboard navigation, and important empty/error states.
- For backend QA, include API contract behavior, persistence effects, authorization, validation, and transaction/failure cases.
- For release or high-risk changes, create a concise regression checklist with pass/fail status and unresolved risks.
- Capture enough evidence to be useful: commands, failing assertions, reproduction steps, environment assumptions, and screenshots only when visual evidence matters.
- Confirm required backend coverage thresholds when coverage is part of the task or when touching security-critical domain logic.
- End with a clear quality report: what passed, what failed, what was not tested, and recommended next action.

## Checklist

- [ ] Domain tests exist and cover aggregate invariants plus emitted events.
- [ ] Command handler tests exist with Repository/EventBus ports mocked.
- [ ] Query handler tests exist for read model mapping when query behavior changes.
- [ ] Projection idempotency tests exist when projections/events/read models change.
- [ ] Security tests include redirect URI, PKCE, and relevant auth/OIDC invariants.
- [ ] Unit tests do not require NestJS module loading.
- [ ] Every test case has a Korean behavior description in the test name or adjacent comment.
- [ ] External services are mocked.
- [ ] Domain logic is not mocked.
- [ ] Test data uses `@faker-js/faker`, `fishery`, or `fast-check` where generated values or factories are useful.
- [ ] Generated test data is deterministic through fixed values, controlled overrides, seeds, or reported property-test seeds.
- [ ] Security-critical domain coverage is at least 90%.
- [ ] Overall backend coverage is at least 85%.
