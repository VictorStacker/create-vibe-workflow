# Create Vibe Workflow

[中文](./README.md) | **English**

> Battle-tested Claude Code workflow from a 21-module production system. One command installs everything. Built for vibe coders — code with natural language.

---

## Why This Exists

After installing a dozen Claude Code plugins, I found massive overlap — four skills fighting over planning, three versions of code review, two parallel debug modes. Every session, a random skill gets matched. Behavior is unreproducible.

After auditing five open-source projects (superpowers, gstack, OpenSpec, ECC, Matt Pocock skills), I realized they each handle one layer with zero overlap — but need glue to work together. Write routing tables so they don't fight. Extract rules so they have discipline. Add missing pieces to complete the flow.

This tool is that glue: **not a plugin of plugins — a bridge between plugins.**

---

## Quick Start

```bash
npx create-vibe-workflow       # Terminal
# Restart Claude Code → auto-detect missing deps → paste install commands → done
```

| Flag | Description |
|------|-------------|
| (none) | Interactive install (merge mode) |
| `--overwrite` | Force overwrite |
| `--uninstall` | Clean up all generated files |
| `--check` | Health check |
| `--codex` | Generate Codex CLI config |

---

## Five Tools, Nine Layers

### What We Take From Each

| Tool | Role | We Take | We Skip |
|------|------|---------|---------|
| [**superpowers**](https://github.com/obra/superpowers) | Brain (how to think) | All 14 skills | Never duplicate |
| [**gstack**](https://github.com/garrytan/gstack) | Hands (how to act) | All 45 commands | Never clone |
| [**OpenSpec**](https://github.com/Fission-AI/OpenSpec) | Spec language | Change tracking format | No CLI, no shell |
| [**ECC**](https://github.com/affaan-m/everything-claude-code) | Infrastructure | Rules + hooks essence | Don't install ECC |
| [**Matt Pocock**](https://github.com/amazingloft999-droid/mattpocock-skills) | Interrogation | 6 key skills | Don't install full repo |

Core principle: **Fewer components, clearer boundaries.**

### Nine-Layer Architecture

```
1: Validate     → /office-hours                  "Is this worth building?"
2: Interrogate  → grill-me                       "What exactly do you want?"
3: Specify      → /opsx:propose                  "Write it down, lock it in"
4: Design       → superpowers brainstorming      "How should we build it?"
5: Plan         → superpowers writing-plans      "Break it into steps"
6: Code         → superpowers TDD + subagent     "Build it with tests"
7: Verify       → gstack /browse + /qa           "See it in a real browser"
8: Review       → arch-gate → /review → /cso     "Architecture? Code? Security?"
9: Ship         → gstack /ship → /opsx:archive   "Deploy + record"
```

Layers 1-3 are the critical gate for vibe coders: validate the demand, interrogate the idea, lock the spec. Skip these and you build something nobody wants.

---

## Routing Table

| Task | Tool |
|------|------|
| Validate demand | `gstack /office-hours` |
| Interrogate idea | `grill-me` skill |
| Conversation → PRD | `to-prd` skill |
| Write spec | `/opsx:propose` |
| Design solution | `superpowers brainstorming` |
| Write implementation plan | `superpowers writing-plans` |
| Track progress (auto) | `todolist-management` skill |
| Write code (TDD) | `superpowers test-driven-development` |
| Debug | `superpowers systematic-debugging` |
| Browser / QA | `gstack /browse` / `/qa` |
| Architecture check (auto) | `architecture-gate` skill |
| Code review | `gstack /review` |
| Security audit | `gstack /cso` |
| Pre-completion check | `superpowers verification-before-completion` |
| Finish branch | `superpowers finishing-a-development-branch` |
| Ship | `gstack /ship` |
| Archive | `/opsx:archive` |
| Save / restore progress | `gstack /context-save` / `/context-restore` |
| Safety guardrails | `gstack /careful` / `/guard` |

---

## What Gets Installed

- **20 skills** (10 workflow core + 6 domain + 4 advanced)
- **3 commands** (propose / explore / archive)
- **10 rules** + memory system + hooks + routing table

---

## todolist: Session Continuity

Auto-generates `todolist.md` after `writing-plans` completes:

- P0/P1 checkbox format, max 7 P0 items
- Auto-checks tasks on completion
- New sessions auto-read pending tasks
- Survives session interruptions

This is something neither superpowers nor gstack handles well on their own.

---

## Memory System

| Layer | Source | Mechanism |
|-------|--------|-----------|
| L1 Working | gstack | `/context-save` → `/context-restore` |
| L2 Project | Superpowers | 4-type frontmatter (user/feedback/project/reference) |
| L3 Archive | OpenSpec | `openspec/changes/archive/` timeline |

---

## Core Principles

1. **Process → superpowers** — brainstorming, plan, TDD, verify, debug
2. **Execution → gstack** — browser, QA, review, cso, ship, guardrails
3. **Independent reviewer** — never review code in the same context that wrote it
4. **Evidence first** — never claim completion without verifiable proof
5. **Brainstorm ambiguity** — 5 minutes clarifying saves 5 hours redoing
6. **Read todolist first** — every new session starts by checking `todolist.md`

---

## Credits

This tool integrates the best of five open-source projects. Huge thanks to the original authors:

| Project | Author | What we integrated |
|---------|--------|--------------------|
| [superpowers](https://github.com/obra/superpowers) | Jesse Vincent (@obra) | 14 workflow skills |
| [gstack](https://github.com/garrytan/gstack) | Garry Tan (@garrytan) | 45 execution commands |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Fission AI | Change tracking format |
| [ECC](https://github.com/affaan-m/everything-claude-code) | Affaan Mustafa (@affaan-m) | Rules + hooks templates |
| [mattpocock-skills](https://github.com/amazingloft999-droid/mattpocock-skills) | Matt Pocock (@mattpocock) | grill-me / to-prd / caveman |

## License

[MIT](./LICENSE)
