---
name: backend
description: Backend 설계, 구현, 테스트를 위한 프로젝트 스킬. Use when Codex needs to design APIs or services, implement domain logic, persistence, authentication/authorization, integrations, migrations, background jobs, observability, or backend tests in this project. This project uses strict hexagonal architecture with domain/application/infrastructure/presentation layers, ports and adapters, DTO private constructor + static of() factories, mandatory tests for every code change, and regression test execution after implementation.
---

# Backend Skill

## Goal

Deliver backend changes that preserve domain rules, API contracts, data integrity, security boundaries, and operational reliability.

## Architecture Rules

Use strict hexagonal architecture.

Dependency direction is mandatory:

```text
presentation -> application -> domain
infrastructure -> application -> domain
```

The domain layer must never depend on NestJS, MikroORM, decorators, persistence entities, framework exceptions, or any infrastructure/presentation concern.

Layer responsibilities:

- `domain`: pure TypeScript only. Own business invariants and emit domain events.
- `application`: define ports, command/query handlers, and application DTOs.
- `infrastructure`: implement persistence, cache, crypto and other adapters.
- `presentation`: HTTP entry point only. Controllers delegate to application handlers.

Ports and adapters:

- Define port interfaces only in the application layer.
- Place command-side ports under `application/commands/ports`.
- Place query-side ports under `application/query/ports`.
- Implement ports only in infrastructure adapters.
- Never call ports directly from controllers. Controllers call handlers only.
- Keep provider configuration code only under `infrastructure/oidc-provider`.

## DTO Rules

All DTOs in every layer must use a private constructor plus `static of()` factory.

```typescript
export class CreateUserDto {
  private constructor(
    readonly username: string,
    readonly password: string,
    readonly email?: string,
  ) {}

  static of(params: { username: string; password: string; email?: string }): CreateUserDto {
    return new CreateUserDto(params.username, params.password, params.email);
  }
}
```

- Never instantiate a DTO with `new DTO()` outside its own `static of()` method.
- Use `CreateUserDto.of(...)`, `SomeRequestDto.of(...)`, or equivalent factories everywhere.
- `presentation/dto` request DTOs must use `class-validator` decorators for strict input validation.
- `application/dto` DTOs must remain pure data containers and must not use `class-validator`.
- Preserve DTO immutability with readonly constructor parameters unless the existing codebase has a stronger local convention.

## 설계

- Inspect the existing backend stack, module boundaries, domain model, database access pattern, dependency injection style, and error handling before changing code.
- Clarify the contract first: inputs, outputs, status codes, validation, authorization, idempotency, pagination, sorting, filtering, and error shapes.
- Place behavior in the correct hexagonal layer: controller in presentation, command/query handler and ports in application, invariants/events in domain, adapter implementations in infrastructure.
- Design database changes with migration order, rollback impact, defaults, indexes, constraints, and backfill needs in mind.
- Treat security and privacy as first-class design constraints: authentication, authorization, tenant isolation, secrets, logging, and PII exposure.
- Consider operational behavior: retries, timeouts, transactions, concurrency, rate limits, monitoring, and failure modes.

## 구현

- Follow existing naming, module organization, validation libraries, DTO/schema conventions, and dependency patterns.
- Enforce dependency direction while editing imports. Domain imports must stay framework-free and persistence-free.
- After writing or changing backend production code, always add or update test code that proves the changed behavior.
- Keep API behavior backward-compatible unless the user explicitly requests a breaking change.
- Validate all external input at the boundary and keep internal types narrow.
- Use transactions where multiple writes must succeed or fail together.
- Avoid ad hoc SQL/string manipulation when the project has an ORM, query builder, schema library, or typed client.
- Keep integration code isolated behind adapters so domain logic remains testable.
- Keep controllers thin: no business logic, persistence calls, port calls, crypto, cache, or provider glue. Delegate to application handlers.
- Keep application code free of infrastructure implementations. It may define port interfaces and handler orchestration only.
- Add logging or metrics only where they help diagnose real operational failures, and avoid leaking secrets or sensitive data.

## 테스트

- Test code is mandatory for every backend production code change. Do not finish after implementation only.
- After writing the relevant tests, run regression tests before reporting completion.
- Run targeted backend tests for changed services, routes, repositories, migrations, and integrations.
- Add or update tests for success paths, validation failures, authorization failures, not-found cases, conflict/idempotency behavior, and persistence effects.
- Verify migrations against the configured test database when database schema changes are included.
- Prefer integration or e2e tests when the change crosses API, database, authentication, or external-service boundaries.
- Use mocks/fakes for unstable external systems unless the project already has reliable local containers or contract tests.
- Check architecture constraints before finishing: domain has no framework imports, DTOs use `private constructor` plus `static of()`, ports are application interfaces, adapters are infrastructure implementations, and controllers delegate only to handlers.
- Report commands run, important failures, and any checks that could not be executed.

## Checklist

- [ ] `domain`: no NestJS, MikroORM, decorators, persistence entities, or framework exceptions.
- [ ] DTOs: use `private constructor` plus `static of()` and avoid direct `new DTO()` calls.
- [ ] `presentation/dto`: use `class-validator` decorators for strict request validation.
- [ ] `application/dto`: avoid `class-validator` and stay as pure data containers.
- [ ] `application`: define command/query handlers and port interfaces only.
- [ ] Ports: locate interfaces under `application/commands/ports` or `application/query/ports`.
- [ ] `infrastructure`: contain persistence/cache/crypto/provider glue and port adapter implementations.
- [ ] `presentation`: keep controllers as HTTP entry points that delegate to application handlers only.
- [ ] Test code was added or updated for the backend code change.
- [ ] Regression tests were executed after implementation.
