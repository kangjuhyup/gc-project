---
name: documentation
description: 프로젝트 문서화 스킬. Use when Codex needs to create, update, review, or organize project documentation such as architecture docs, API docs, ADRs, setup guides, runbooks, testing notes, release notes, or developer onboarding docs. Apply this skill when documenting frontend, backend, QA, infrastructure, security, or operational decisions in this project.
---

# Documentation Skill

## Goal

Create documentation that is accurate, maintainable, easy to scan, and directly useful for future implementation, review, onboarding, and operations.

## Principles

- Document decisions, contracts, workflows, and operational knowledge that are hard to recover from code alone.
- Keep documentation close to the code or domain it explains when the repository already has a convention.
- Prefer concise, structured documents over broad narrative.
- State facts separately from assumptions, TODOs, and open questions.
- Keep examples current and runnable where possible.
- Update existing documentation before creating a new document when the topic already has a home.
- Avoid duplicating source-of-truth details that can drift, such as generated schemas, full env lists, or exhaustive code listings.

## 설계

- Identify the document type first: architecture overview, ADR, API contract, setup guide, runbook, troubleshooting guide, test plan, release note, or onboarding note.
- Identify the audience: frontend engineer, backend engineer, QA, operator, reviewer, or new contributor.
- Define the minimum useful scope: purpose, context, decisions, affected modules, commands, examples, risks, and verification steps.
- For architecture docs, show boundaries and dependency direction clearly. Mention frontend state ownership or backend hexagonal layers when relevant.
- Visualize the overall architecture with Mermaid diagrams when documenting system structure, layer boundaries, dependency direction, request flow, event flow, or deployment topology.
- For API docs, include request/response shape, auth/permission expectations, error behavior, idempotency, and examples.
- For runbooks, include symptoms, impact, diagnosis commands, mitigation, rollback, and escalation notes.
- For testing docs, include test levels, required commands, fixtures/data, expected evidence, and known gaps.

## 구현

- Use Markdown unless the user asks for another format.
- Use clear headings and short sections. Keep checklists actionable.
- Use Mermaid diagrams for overall architecture visualization. Prefer `flowchart`, `sequenceDiagram`, or `C4Context`-style flowcharts depending on the topic.
- Keep Mermaid diagrams readable: short node labels, clear layer boundaries, and only the relationships needed to explain the document's point.
- Prefer tables only when they make comparison easier.
- Use relative repository paths in docs when they are meant for developers reading the repo.
- Include exact commands when they are stable and project-owned.
- Link to existing files instead of copying large content.
- For ADRs, include status, context, decision, consequences, and alternatives considered.
- For setup docs, distinguish required steps from optional local conveniences.
- For security-sensitive topics, avoid recording secrets, tokens, private keys, client secrets, or production credentials.
- When documenting environment variables, describe purpose and whether the value is client-exposed, but never include real secret values.

## 테스트

- Verify that referenced files, directories, commands, and config names exist when practical.
- Run documented commands only when they are safe and relevant to the task.
- Check that code examples compile conceptually against the current project conventions.
- Check links and paths for obvious drift.
- Confirm that instructions do not conflict with project rules from frontend, backend, or QA skills.
- Report any documentation claims that could not be verified.

## Checklist

- [ ] Audience and document type are clear.
- [ ] Existing docs were updated instead of duplicated when appropriate.
- [ ] Architecture/API/test/operation details match the current codebase.
- [ ] Commands, paths, and config names were verified where practical.
- [ ] Security-sensitive values are not included.
- [ ] Open questions and assumptions are labeled.
- [ ] The document has a clear next action or usage path.
