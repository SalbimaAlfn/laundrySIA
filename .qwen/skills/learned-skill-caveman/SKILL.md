---
name: caveman
description: Compress AI agent output using caveman voice for 33-65% token reduction
source: learned
---

# Caveman Token Reduction Skill

## When to Use

- Working with AI coding agents (Claude, Codex, Gemini, OpenCode)
- Need to reduce token usage and costs in AI-assisted coding
- Want faster agent responses without losing meaningful information
- Processing large logs, JSON, CSV, or test output before feeding to AI
- Multi-turn conversations where token budget is a concern

## Procedure

### 1. Enable Caveman Voice Mode

Use one of three compression levels based on needed verbosity:

| Mode | When to Use | Example Output |
|------|-------------|----------------|
| `/caveman` | Standard responses, most tasks | "New object ref each render, so React re-renders. Wrap the prop in `useMemo`." |
| `/ultracave` | Short tasks, experienced users | "Inline object prop, new ref, re-render. `useMemo`." |
| `/megacave` | Minimal context, ultra-compression | "新參照致重繪。`useMemo`。" |

### 2. Follow Voice Rules

- **Answer first** — Lead with the solution, not preamble
- **One idea per sentence** — Keep responses tight
- **Never drop meaning** — Keep negations, numbers, units, and code verbatim
- **Payload verbatim** — Preserve code, paths, errors unchanged
- **No theater** — Skip pleasantries, acknowledgments, and filler
- **Know when to stop** — End when the answer is complete

### 3. Compress Input Files (Read Less)

Before feeding files to AI, compress them:

- **CSV**: Remove headers, condense rows → ~98% reduction
- **Logs**: Keep only ERROR/WARN lines → ~98% reduction  
- **JSON**: Extract only needed keys → ~98% reduction
- **YAML**: Remove comments, condense → ~99% reduction
- **Test output**: Keep summary + failures only → ~99% reduction

### 4. Use Blocks for Repeated Scripts

Replace common commands with pre-built blocks:
- `test-summary` — replaces verbose test output
- `json-peek` — peek large JSON without full load
- `grep-defs` — find definitions without full scan

## Pitfalls

- **Over-compressing**: Removing too much context breaks understanding — keep numbers, units, negations
- **Losing code**: Never compress code blocks, file paths, or error messages — preserve verbatim
- **Wrong mode**: `/megacave` loses too much for complex tasks — use `/caveman` for important work
- **Input not output**: Caveman voice compresses AI output; separately compress input files for best results
- **Privacy**: When using compression tools, files are sent to model provider — use local-only skill for sensitive data