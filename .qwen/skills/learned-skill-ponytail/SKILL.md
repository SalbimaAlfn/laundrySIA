---
name: ponytail
description: Prompt engineering tool for lazy senior developer workflow - minimize code, reuse components, reduce token usage
source: learned
---

# Ponytail - Lazy Senior Developer Workflow

## When to Use
- When building software and you want to avoid over-engineering (YAGNI principle)
- When you want AI agents to prioritize reusing existing code over writing new code
- When you need code review focused on what to cut, not just what to add
- When tracking technical debt across a project
- When optimizing for lower token usage, costs, and latency

## Procedure

### 1. Activate Ponytail Mode
```
/ponytail [lite | full | ultra | off]
```
- **lite**: Minimal laziness - small reuse suggestions
- **full**: Standard laziness - aggressive component reuse
- **ultra**: Maximum laziness - avoid new code at all costs
- **off**: Disable Ponytail

### 2. Review Code Changes
```
/ponytail-review
```
Analyzes current diffs for:
- Bugs and security risks
- Unnecessary code that can be cut
- Opportunities to reuse existing components
- Performance issues

### 3. Audit Entire Repository
```
/ponytail-audit
```
Comprehensive check of codebase to:
- Rank issues by priority
- Identify redundant code
- Find missing reuse opportunities

### 4. Track Technical Debt
Use `shortcut:` comments in code:
```typescript
// shortcut: refactor this duplicated logic
// shortcut: consider using existing utility
```
The tool collects these into a debt ledger to prevent forgotten tasks.

## Pitfalls
- **Over-aggressive cutting**: Sometimes new code is the right choice - use judgment
- **Context loss**: Ponytail works best when the agent has full repository context
- **Mixed modes**: Switching between lite/ultra/full mid-project can cause inconsistent results
- **Legacy code**: New code against legacy systems may need new implementation even when reuse is possible
- **Team alignment**: Ensure all team members use the same Ponytail intensity to avoid code style conflicts

## Compatible Platforms
- Claude Code (via plugins)
- Codex (via plugins)
- Cursor, Windsurf, Cline, Copilot (via rules/instructions)
- Gemini, Grok Build, Devin CLI, OpenCode, and other agents